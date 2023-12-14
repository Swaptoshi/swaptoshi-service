const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');
const Redis = require('ioredis');
const { requestMarket } = require('../../utils/request');

const config = require('../../../config');

const lastPriceTableSchema = require('../../database/schema/lastPrice');
const { getLSKTokenID } = require('../business/interoperability/blockchainApps');

const LSKUSD_LAST_PRICE_CACHE_KEY = 'lskusd_last_price';
const LAST_PRICE_TTL = config.dex.lastPriceInterval;
const MYSQL_ENDPOINT = config.endpoints.mysql;

const redis = new Redis(config.endpoints.cache);

const getLastPriceTable = () =>
	getTableInstance(lastPriceTableSchema.tableName, lastPriceTableSchema, MYSQL_ENDPOINT);

const getLSKUSDLastPrice = async () => {
	const lskTokenId = await getLSKTokenID();

	const cache = await redis.get(LSKUSD_LAST_PRICE_CACHE_KEY);
	if (cache) {
		return JSON.parse(cache);
	}

	const lastPriceTable = await getLastPriceTable();
	const lastPrice = await lastPriceTable.find({ tokenId: lskTokenId, limit: 1 }, [
		'tokenId',
		'updatedOn',
		'current',
		'1h',
		'24h',
		'7d',
		'30d',
		'1y',
	]);

	await redis.set(
		LSKUSD_LAST_PRICE_CACHE_KEY,
		JSON.stringify(lastPrice[0]),
		'EX',
		Math.floor(Date.now() / 1000) % LAST_PRICE_TTL,
	);

	return lastPrice[0];
};

const getLSKUSDPrice = async () => {
	const market = await requestMarket('prices');
	const lskusd = market.data.filter(t => t.code === 'LSK_USD');
	if (lskusd.length === 0) throw new Error('LSKUSD price currently not available');
	return parseFloat(lskusd[0].rate);
};

const getLSKUSDPriceAtTimestamp = async timestamp => {
	const market = await requestMarket('candlestick', {
		symbol: 'LSKUSDT',
		interval: '1s',
		start: timestamp,
		end: timestamp,
	});
	return market[0].open;
};

const getLSKUSDCandles = async (start, end = start, interval = '5m') => {
	const market = await requestMarket('candlestick', {
		symbol: 'LSKUSDT',
		interval,
		start,
		end,
	});
	return market;
};

module.exports = {
	getLSKUSDPrice,
	getLSKUSDPriceAtTimestamp,
	getLSKUSDCandles,
	getLSKUSDLastPrice,
};
