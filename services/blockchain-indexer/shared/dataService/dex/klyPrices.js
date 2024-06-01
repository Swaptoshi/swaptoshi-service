const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');
const Redis = require('ioredis');
const { requestMarket } = require('../../utils/request');

const config = require('../../../config');

const lastPriceTableSchema = require('../../database/schema/lastPrice');
const { getKLYTokenID } = require('../business/interoperability/blockchainApps');
const { intervalToSecond } = require('./timestamp');

const KLYUSD_LAST_PRICE_CACHE_KEY = 'klyusd_last_price';
const LAST_PRICE_TTL = intervalToSecond[config.dex.lastPriceInterval];
const MYSQL_ENDPOINT = config.endpoints.mysql;

const redis = new Redis(config.endpoints.cache);

const getLastPriceTable = () =>
	getTableInstance(lastPriceTableSchema.tableName, lastPriceTableSchema, MYSQL_ENDPOINT);

const getKLYUSDLastPrice = async () => {
	const klyTokenId = await getKLYTokenID();

	const cache = await redis.get(KLYUSD_LAST_PRICE_CACHE_KEY);
	if (cache) {
		return JSON.parse(cache);
	}

	const lastPriceTable = await getLastPriceTable();
	const lastPrice = await lastPriceTable.find({ tokenId: klyTokenId, limit: 1 }, [
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
		KLYUSD_LAST_PRICE_CACHE_KEY,
		JSON.stringify(lastPrice[0]),
		'EX',
		Math.floor(Date.now() / 1000) % LAST_PRICE_TTL,
	);

	return lastPrice[0];
};

const getKLYUSDPrice = async () => {
	const market = await requestMarket('prices');
	const klyusd = market.data.filter(t => t.code === 'KLY_USD');
	if (klyusd.length === 0) throw new Error('KLYUSD price currently not available');
	return parseFloat(klyusd[0].rate);
};

const getKLYUSDPriceAtTimestamp = async timestamp => {
	const market = await requestMarket('candlestick', {
		symbol: 'KLYUSDT',
		interval: '1s',
		start: timestamp,
		end: timestamp,
	});
	return market[0].open;
};

const getKLYUSDCandles = async (start, end = start, interval = '5m') => {
	const market = await requestMarket('candlestick', {
		symbol: 'KLYUSDT',
		interval,
		start,
		end,
	});
	return market;
};

module.exports = {
	getKLYUSDPrice,
	getKLYUSDPriceAtTimestamp,
	getKLYUSDCandles,
	getKLYUSDLastPrice,
};
