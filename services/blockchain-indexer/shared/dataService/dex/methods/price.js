/* eslint-disable prefer-destructuring */
const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');

const { getTickPriceTableSchema } = require('../../../database/dynamic-schema/tickPrice');

const config = require('../../../../config');
const { getOhlcTableSchema } = require('../../../database/dynamic-schema/ohlc');
const { intervalToSecond } = require('../timestamp');
const { parseQueryResult } = require('../../../utils/query');

const MYSQL_ENDPOINT = config.endpoints.mysql;

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

const getTickPrice = async params => {
	const { start, end } = params;

	const includeConversion =
		params.base.toLowerCase() !== 'lsk' && params.quote.toLowerCase() === 'usd';
	const pair = `${params.base.toLowerCase()}${
		includeConversion ? 'lsk' : params.quote.toLowerCase()
	}`;

	const offset = params.offset || 0;
	const limit = params.limit || 100;

	const joinQuery = `${
		includeConversion ? 'LEFT JOIN tick_lskusd AS quote ON base.time = quote.time' : ''
	}`;

	const query = `
            SELECT *
            FROM (
                SELECT
                    base.time,
                    base.value * ${includeConversion ? 'quote.value' : '1'} AS value
                FROM
                    tick_${pair} AS base
                    ${joinQuery}
                WHERE
					1 = 1
                    ${params.interval ? `AND MOD(base.time, ${params.interval}) = 0` : ''}
					${start ? `AND base.time >= ${start}` : ''} 
					${end ? `AND base.time <= ${end}` : ''} 
                ORDER BY
                    base.time DESC
				${limit ? `LIMIT ${limit}` : ''}
				${offset ? `OFFSET ${offset}` : ''}
                ) AS latest_entries
            ORDER BY time ASC;
    `;

	const tickPriceTable = await getTickPriceTable(pair);
	const response = {
		data: {},
		meta: {},
	};

	const ticks = parseQueryResult(await tickPriceTable.rawQuery(query));

	response.data = ticks;
	response.meta = {
		count: ticks.length,
		offset,
		total: await tickPriceTable.count(),
	};
	return response;
};

const getOhlcPrice = async params => {
	const { start, end, timeframe } = params;

	const includeConversion =
		params.base.toLowerCase() !== 'lsk' && params.quote.toLowerCase() === 'usd';
	const pair = `${params.base.toLowerCase()}${
		includeConversion ? 'lsk' : params.quote.toLowerCase()
	}`;

	if (intervalToSecond[timeframe] === undefined) throw new Error('invalid timeframe');
	const offset = params.offset || 0;
	const limit = params.limit || 100;
	const ohlcTable = await getOhlcPriceTable(pair, timeframe);

	const query = `
    SELECT *
	FROM (
		SELECT 
			ohlc1.time, 
			ohlc1.open * ${includeConversion ? 'ohlc2.open' : '1'} AS open,
			ohlc1.high * ${includeConversion ? 'ohlc2.high' : '1'} AS high,
			ohlc1.low * ${includeConversion ? 'ohlc2.low' : '1'} AS low,
			ohlc1.close * ${includeConversion ? 'ohlc2.close' : '1'} AS close
		FROM 
			${getOhlcTableSchema(pair, timeframe).tableName} AS ohlc1 
			${includeConversion ? `JOIN ohlc_lskusd_${timeframe} AS ohlc2 ON ohlc1.time = ohlc2.time` : ''} 
		WHERE 1 = 1 
			${start ? `AND ohlc1.time >= ${start}` : ''} 
			${end ? `AND ohlc1.time <= ${end}` : ''} 
		ORDER BY time DESC 
		${limit ? `LIMIT ${limit}` : ''}
		${offset ? `OFFSET ${offset}` : ''}
	) AS ohlc
	ORDER BY time ASC;`;

	const response = {
		data: {},
		meta: {},
	};

	const ohlc = parseQueryResult(await ohlcTable.rawQuery(query));

	response.data = ohlc;
	response.meta = {
		count: ohlc.length,
		offset,
		total: await ohlcTable.count(),
	};
	return response;
};

module.exports = { getTickPrice, getOhlcPrice };
