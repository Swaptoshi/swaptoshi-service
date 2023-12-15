/* eslint-disable prefer-destructuring */
const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

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
	let quote = params.quote.toLowerCase() !== 'lsk' ? 'usd' : 'lsk';
	if (params.base === 'lsk') quote = 'usd';
	const pair = `${params.base}${quote}`;
	const { start, end } = params;
	const offset = params.offset || 0;
	const limit = params.limit || 100;
	const tickTable = await getTickPriceTable(pair);

	const query = `
    SELECT *
	FROM (
		SELECT 
			tick1.time, 
			tick1.value * ${quote === 'usd' ? 'tick2.value' : '1'} AS value 
		FROM 
			${getTickPriceTableSchema(pair).tableName} AS tick1 
		${quote === 'usd' ? 'JOIN tick_lskusd AS tick2 ON tick1.time = tick2.time' : ''} 
		WHERE 1 = 1 
			${start ? `AND tick1.time >= ${start}` : ''} 
			${end ? `AND tick1.time <= ${end}` : ''} 
		ORDER BY time DESC 
		${limit ? `LIMIT ${limit}` : ''}
		${offset ? `OFFSET ${offset}` : ''}
	) AS table
	ORDER BY time ASC;`;

	const response = {
		data: {},
		meta: {},
	};

	const ticks = parseQueryResult(await tickTable.rawQuery(query));

	response.data = ticks;
	response.meta = {
		count: ticks.length,
		offset,
		total: await tickTable.count(),
	};
	return response;
};

const getOhlcPrice = async params => {
	let quote = params.quote.toLowerCase() !== 'lsk' ? 'usd' : 'lsk';
	if (params.base === 'lsk') quote = 'usd';
	const pair = `${params.base}${quote}`;
	const { start, end, timeframe } = params;

	if (intervalToSecond[timeframe] === undefined) throw new Error('invalid timeframe');
	const offset = params.offset || 0;
	const limit = params.limit || 100;
	const ohlcTable = await getOhlcPriceTable(pair, timeframe);

	const query = `
    SELECT *
	FROM (
		SELECT 
			ohlc1.time, 
			ohlc1.open * ${quote === 'usd' ? 'ohlc2.open' : '1'} AS open,
			ohlc1.high * ${quote === 'usd' ? 'ohlc2.high' : '1'} AS high,
			ohlc1.low * ${quote === 'usd' ? 'ohlc2.low' : '1'} AS low,
			ohlc1.close * ${quote === 'usd' ? 'ohlc2.close' : '1'} AS close
		FROM 
			${getOhlcTableSchema(pair, timeframe).tableName} AS ohlc1 
		${quote === 'usd' ? `JOIN ohlc_lskusd_${timeframe} AS ohlc2 ON ohlc1.time = ohlc2.time` : ''} 
		WHERE 1 = 1 
			${start ? `AND ohlc1.time >= ${start}` : ''} 
			${end ? `AND ohlc1.time <= ${end}` : ''} 
		ORDER BY time DESC 
		${limit ? `LIMIT ${limit}` : ''}
		${offset ? `OFFSET ${offset}` : ''}
	) AS table
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
