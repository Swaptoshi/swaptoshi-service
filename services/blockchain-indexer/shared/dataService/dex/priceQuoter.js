const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const config = require('../../../config');

const MYSQL_ENDPOINT = config.endpoints.mysql;
const MAX_RECURSION = config.dex.maxRouteLength;
const LAST_PRICE_INTERVAL = config.dex.lastPriceInterval;

const poolTableSchema = require('../../database/schema/pool');
const { getOhlcTableSchema } = require('../../database/dynamic-schema/ohlc');
const { decodeFirstPool, hasMultiplePools, skipToken } = require('../../indexer/utils/tradingPath');
const { intervalToSecond, normalizeBlockTime } = require('./timestamp');
const { getLSKTokenID } = require('../business/interoperability/blockchainApps');
const { getLSKUSDPrice } = require('./lskPrices');
const { getTickPriceTableSchema } = require('../../database/dynamic-schema/tickPrice');
const { parseQueryResult } = require('../../utils/query');

const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);

const getTickPriceTable = pair =>
	getTableInstance(
		getTickPriceTableSchema(pair).tableName,
		getTickPriceTableSchema(pair),
		MYSQL_ENDPOINT,
	);

const getOhlcPriceTable = (pair, timeframe) =>
	getTableInstance(
		getOhlcTableSchema(pair, timeframe).tableName,
		getOhlcTableSchema(pair, timeframe),
		MYSQL_ENDPOINT,
	);

const usdTokenId = `X${'USD'.repeat(5)}`;

const lastPriceQuery = (pair, timestamp) => {
	const query = `
    SELECT value
    FROM tick_${pair}
    WHERE time = ${timestamp}
    LIMIT 1;
  `;
	return query;
};

const nearestLastPriceQuery = (pair, timestamp) => {
	const query = `
    SELECT value
    FROM tick_${pair}
    ORDER BY ABS(time - ${timestamp})
    LIMIT 1;
  `;
	return query;
};

const getLastPriceFromTickPriceTable = async (pair, timestamp, timeframe) => {
	if (!Object.keys(intervalToSecond).includes(timeframe)) throw new Error('invalid timeframe');
	const tickTable = await getTickPriceTable(pair);

	let price = parseQueryResult(
		await tickTable.rawQuery(lastPriceQuery(pair, timestamp - intervalToSecond[timeframe])),
	);
	if (price.length === 0)
		price = parseQueryResult(
			await tickTable.rawQuery(
				nearestLastPriceQuery(pair, timestamp - intervalToSecond[timeframe]),
			),
		);
	if (price.length !== 0) return price[0].value;
	return 0;
};

const getLastPrice = async (pair, timestampSecond) => {
	const timestamp = normalizeBlockTime(timestampSecond, LAST_PRICE_INTERVAL);
	const lastPrice = {
		updatedOn: timestamp,
		current: await getLastPriceFromTickPriceTable(pair, timestamp, 'current'),
		'1h': await getLastPriceFromTickPriceTable(pair, timestamp, '1h'),
		'24h': await getLastPriceFromTickPriceTable(pair, timestamp, '24h'),
		'7d': await getLastPriceFromTickPriceTable(pair, timestamp, '7d'),
		'30d': await getLastPriceFromTickPriceTable(pair, timestamp, '30d'),
		'1y': await getLastPriceFromTickPriceTable(pair, timestamp, '1y'),
	};
	return lastPrice;
};

const getWeightedPrice = async (token0, token1, dbTrx) => {
	if (typeof token0 !== 'string' || token0.length !== 16) throw new Error('invalid token0');
	if (typeof token1 !== 'string' || token1.length !== 16) throw new Error('invalid token1');

	const poolTable = await getPoolTable();
	const query = `
      SELECT
        SUM(price * liquidity) / SUM(liquidity) AS weightedPrice
      FROM
        ${poolTableSchema.tableName}
      WHERE
        token0 = '${token0}'
        AND token1 = '${token1}'`;
	const pool = parseQueryResult(await poolTable.rawQuery(query, dbTrx));
	if (pool.length === 0) return 0;
	return pool[0].weightedPrice || 0;
};

const getRoute = async (from, to, maxRecursion = 5, limit = 1, dbTrx) => {
	if (typeof from !== 'string' || from.length !== 16) throw new Error('invalid from');
	if (typeof to !== 'string' || to.length !== 16) throw new Error('invalid to');
	if (typeof maxRecursion !== 'number') throw new Error('invalid maxRecursion');
	if (typeof limit !== 'number') throw new Error('invalid limit');

	const poolTable = await getPoolTable();
	const query = `
      WITH RECURSIVE ShortestPath AS (
        SELECT
          token0 AS node,
          token1 AS nextNode,
          fee AS totalFee,
          1 AS depth,
          CONCAT(token0, feeHex, token1) AS path
        FROM
          ${poolTableSchema.tableName}
        WHERE
          token0 = '${from}'
      
        UNION ALL
      
        SELECT
          sp.nextNode AS node,
          t.token1 AS nextNode,
          sp.totalFee + t.fee AS totalFee,
          sp.depth + 1 AS depth,
          CONCAT(sp.path, t.feeHex, t.token1) AS path
        FROM
          ${poolTableSchema.tableName} t
        JOIN
          ShortestPath sp ON t.token0 = sp.nextNode
        WHERE
          sp.depth < ${maxRecursion}
      )
      SELECT
        totalFee,
        path
      FROM
        ShortestPath
      WHERE
        nextNode = '${to}'
      ORDER BY
        totalFee
      LIMIT ${limit}`;
	const route = parseQueryResult(await poolTable.rawQuery(query, dbTrx));
	return route;
};

const getPrice = async (base, quote, dbTrx) => {
	let price = 1;
	const _quote = quote === usdTokenId ? await getLSKTokenID() : quote;

	const route = await getRoute(base, _quote, MAX_RECURSION, 1, dbTrx);
	if (route.length === 0) return 0;
	let _path = route[0].path;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const [tokenIn, tokenOut] = decodeFirstPool(_path);

		const weightedPrice = await getWeightedPrice(tokenIn, tokenOut, dbTrx);

		price *= weightedPrice;

		if (hasMultiplePools(_path)) {
			_path = skipToken(_path);
		} else {
			if (quote === usdTokenId) price *= await getLSKUSDPrice();
			return price;
		}
	}
};

const transformTickToOhlc = async (pair, timeframe, from, to, dbTrx) => {
	const ohlcPriceTable = await getOhlcPriceTable(pair, timeframe);
	const second = intervalToSecond[timeframe];
	const query = `
    SELECT 
      COALESCE(t1.value, 0) AS open,
      COALESCE(m.high, 0) AS high,
      COALESCE(m.low, 0) AS low,
      COALESCE(t2.value, 0) as close,
      open_time * ${second} as open_time
    FROM (
      SELECT MIN(time) AS min_time,
      MAX(time) AS max_time,
      MIN(value) as low,
      MAX(value) as high,
      FLOOR(time/${second}) as open_time
    FROM tick_${pair}
    WHERE time BETWEEN ${from} AND ${to}
    GROUP BY open_time) m
    JOIN tick_${pair} t1 ON t1.time = min_time
    JOIN tick_${pair} t2 ON t2.time = max_time`;
	const ohlc = parseQueryResult(await ohlcPriceTable.rawQuery(query, dbTrx));
	return ohlc;
};

module.exports = {
	usdTokenId,
	getWeightedPrice,
	getRoute,
	getPrice,
	transformTickToOhlc,
	getLastPrice,
};
