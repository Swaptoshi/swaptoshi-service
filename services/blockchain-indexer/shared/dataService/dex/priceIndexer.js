const {
	Logger,
	Queue,
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');
const BluebirdPromise = require('bluebird');

const config = require('../../../config');
const { intervalToSecond, normalizeBlockTime } = require('./timestamp');
const { getLSKTokenID } = require('../business/interoperability/blockchainApps');

const dexTokenTableSchema = require('../../database/schema/registeredDexToken');
const lastPriceTableSchema = require('../../database/schema/lastPrice');
const { getTickPriceTableSchema } = require('../../database/dynamic-schema/tickPrice');
const { getOhlcTableSchema } = require('../../database/dynamic-schema/ohlc');
const { getLSKUSDPriceAtTimestamp, getLSKUSDCandles } = require('./lskPrices');
const { getPrice, transformTickToOhlc, getLastPrice } = require('./priceQuoter');

const logger = Logger();

const MYSQL_ENDPOINT = config.endpoints.mysql;
const MAX_PREVIOUS_LSKUSD_INDEX_BATCH = 720;

const INDEX_TOKEN_CONCURRENCY = config.dex.indexTokenConcurrency;
const LAST_PRICE_INTERVAL = config.dex.lastPriceInterval;
const TICK_TIMEFRAME = config.dex.tickTimeframe;
const OHLC_TIMEFRAMES = config.dex.ohlcTimeframes
	.split(',')
	.filter(t => Object.keys(intervalToSecond).includes(t));

const getOhlcPriceTable = (pair, timeframe) =>
	getTableInstance(
		getOhlcTableSchema(pair, timeframe).tableName,
		getOhlcTableSchema(pair, timeframe),
		MYSQL_ENDPOINT,
	);

const getTickPriceTable = pair =>
	getTableInstance(
		getTickPriceTableSchema(pair).tableName,
		getTickPriceTableSchema(pair),
		MYSQL_ENDPOINT,
	);

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const getLastPriceTable = () =>
	getTableInstance(lastPriceTableSchema.tableName, lastPriceTableSchema, MYSQL_ENDPOINT);

const updateLastPrice = async (baseTokenId, pair, time, dbTrx) => {
	const lastPriceTable = await getLastPriceTable();
	const lastPriceAtTimestamp = await lastPriceTable.find(
		{ tokenId: baseTokenId, updatedOn: time, limit: 1 },
		['updatedOn'],
		dbTrx,
	);
	if (lastPriceAtTimestamp.length > 0) return;

	const lastPrice = await getLastPrice(pair, time);
	if (Object.values(lastPrice).every(Boolean)) {
		await lastPriceTable.upsert({ tokenId: baseTokenId, ...lastPrice }, dbTrx);
		logger.info(`Updated last price at ${time} for pair ${pair.toUpperCase()}`);
	} else {
		logger.debug(`No last price update at ${time} for pair ${pair.toUpperCase()}`);
	}
};

const indexTokenLastPrice = async (timestamp, baseTokenId, quoteTokenId, dbTrx) => {
	if (quoteTokenId !== (await getLSKTokenID()))
		throw new Error('quoting last price only supported on LSK');

	const tokenTable = await getDEXTokenTable();
	const [base] = await tokenTable.find({ tokenId: baseTokenId, limit: 1 }, ['symbol']);
	const [quote] = await tokenTable.find({ tokenId: quoteTokenId, limit: 1 }, ['symbol']);
	const pair = `${base.symbol}${quote.symbol}`.toLowerCase();

	const time = normalizeBlockTime(timestamp, LAST_PRICE_INTERVAL);
	await updateLastPrice(baseTokenId, pair, time, dbTrx);
};

const indexTokenTickPrice = async (timestamp, baseTokenId, quoteTokenId, dbTrx) => {
	const tokenTable = await getDEXTokenTable();
	const [base] = await tokenTable.find({ tokenId: baseTokenId, limit: 1 }, ['symbol']);
	const [quote] = await tokenTable.find({ tokenId: quoteTokenId, limit: 1 }, ['symbol']);
	const pair = `${base.symbol}${quote.symbol}`.toLowerCase();

	const time = normalizeBlockTime(timestamp, TICK_TIMEFRAME);
	const tickPriceTable = await getTickPriceTable(pair);
	const priceAtTimestamp = await tickPriceTable.find({ time, limit: 1 }, ['time'], dbTrx);
	if (priceAtTimestamp.length > 0) return;

	const value = await getPrice(baseTokenId, quoteTokenId, dbTrx);
	if (value !== 0) {
		await tickPriceTable.upsert({ time, value }, dbTrx);
		logger.info(`Updated tick price at ${time} for pair ${pair.toUpperCase()}`);
	}
};

const indexTokenOhlcPrice = async (timestamp, baseTokenId, quoteTokenId, dbTrx) => {
	const tokenTable = await getDEXTokenTable();
	const [base] = await tokenTable.find({ tokenId: baseTokenId, limit: 1 }, ['symbol']);
	const [quote] = await tokenTable.find({ tokenId: quoteTokenId, limit: 1 }, ['symbol']);
	const pair = `${base.symbol}${quote.symbol}`.toLowerCase();

	await BluebirdPromise.map(
		OHLC_TIMEFRAMES,
		async timeframe => {
			const time = normalizeBlockTime(timestamp, timeframe);
			const previousTime = time - intervalToSecond[timeframe];

			const ohlcPriceTable = await getOhlcPriceTable(pair, timeframe);
			const ohlcAtTimestamp = await ohlcPriceTable.find({ time, limit: 1 }, ['time'], dbTrx);
			if (ohlcAtTimestamp.length > 0) return;

			const ohlc = await transformTickToOhlc(pair, timeframe, previousTime, time, dbTrx);
			if (ohlc.length > 0) {
				await ohlcPriceTable.upsert(
					{ time, open: ohlc[0].open, high: ohlc[0].high, low: ohlc[0].low, close: ohlc[0].close },
					dbTrx,
				);

				logger.info(`Updated ohlc price at ${time} for pair ${pair.toUpperCase()} ${timeframe}`);
			} else {
				logger.debug(`No ohlc price update at ${time} for pair ${pair.toUpperCase()} ${timeframe}`);
			}
		},
		{ concurrency: OHLC_TIMEFRAMES.length },
	);
};

const indexTokenPrice = async (timestamp, baseTokenId, quoteTokenId) => {
	await indexTokenTickPrice(timestamp, baseTokenId, quoteTokenId);
	await indexTokenOhlcPrice(timestamp, baseTokenId, quoteTokenId);
	await indexTokenLastPrice(timestamp, baseTokenId, quoteTokenId);
};

/** @param {{timestamp: number}} job */
const indexLSKUSDTickPrice = async job => {
	const time = normalizeBlockTime(job.data.timestamp, TICK_TIMEFRAME);
	const tickPriceTable = await getTickPriceTable(`lskusd`);
	const priceAtTimestamp = await tickPriceTable.find({ time, limit: 1 }, ['time']);
	if (priceAtTimestamp.length > 0) return;

	const value = await getLSKUSDPriceAtTimestamp(time);
	await tickPriceTable.upsert({ time, value });

	logger.info(`Updated tick price at ${time} for pair LSKUSD`);
};

/** @param {{data: {timestamp: number, base: string, quote: string}}} job */
const indexLSDKUSDOhlcPrice = async job => {
	await BluebirdPromise.map(
		OHLC_TIMEFRAMES,
		async timeframe => {
			const pair = 'lskusd';
			const time = normalizeBlockTime(job.data.timestamp, timeframe);
			const previousTime = time - intervalToSecond[timeframe];

			const ohlcPriceTable = await getOhlcPriceTable(pair, timeframe);
			const ohlcAtTimestamp = await ohlcPriceTable.find({ time, limit: 1 }, ['time']);
			if (ohlcAtTimestamp.length > 0) return;

			const ohlc = await transformTickToOhlc(pair, timeframe, previousTime, time);
			if (ohlc.length > 0) {
				await ohlcPriceTable.upsert({
					time,
					open: ohlc[0].open,
					high: ohlc[0].high,
					low: ohlc[0].low,
					close: ohlc[0].close,
				});

				logger.info(`Updated ohlc price at ${time} for pair ${pair.toUpperCase()} ${timeframe}`);
			} else {
				logger.debug(`No ohlc price update at ${time} for pair ${pair.toUpperCase()} ${timeframe}`);
			}
		},
		{ concurrency: OHLC_TIMEFRAMES.length },
	);
};

/** @param {{data: {timestamp: number}}} job */
const indexCurrentLSKUSDPrice = async job => {
	await indexLSKUSDTickPrice(job);
	await indexLSDKUSDOhlcPrice(job);
};

/** @param {{data: {from: number, to: number}}} job */
const indexPreviousLSKUSDTickPrice = async job => {
	const pair = 'lskusd';
	const tickTable = await getTickPriceTable(pair);
	const lskCandles = await getLSKUSDCandles(job.data.from, job.data.to, TICK_TIMEFRAME);

	await BluebirdPromise.map(
		lskCandles.map(t => ({ time: t.start, value: t.open })),
		async ohlc => {
			await tickTable.upsert(ohlc);
			logger.info(`Updated tick price at ${ohlc.time} for pair ${pair.toUpperCase()}`);
		},
		{ concurrency: INDEX_TOKEN_CONCURRENCY },
	);
};

/** @param {{data: {from: number, to: number, timeframe: string}}} job */
const indexPreviousLSKUSDOhlcPrice = async job => {
	const pair = 'lskusd';
	const ohlcPriceTable = await getOhlcPriceTable(pair, job.data.timeframe);
	const lskCandles = await getLSKUSDCandles(job.data.from, job.data.to, job.data.timeframe);

	await BluebirdPromise.map(
		lskCandles,
		async ohlc => {
			await ohlcPriceTable.upsert({ time: ohlc.start, ...ohlc });
			logger.info(
				`Updated ohlc price at ${ohlc.start} for pair ${pair.toUpperCase()} ${job.data.timeframe}`,
			);
		},
		{ concurrency: INDEX_TOKEN_CONCURRENCY },
	);
};

const deleteTickPriceIndex = async (token, block, dbTrx) => {
	const tickTimestamp = normalizeBlockTime(block.timestamp, TICK_TIMEFRAME);
	const tickPriceTable = await getTickPriceTable(`${token.symbol.toLowerCase()}lsk`);

	await tickPriceTable.delete(
		{ propBetweens: [{ property: 'time', greaterThan: tickTimestamp }] },
		dbTrx,
	);

	logger.info(
		`Deleted ${`${token.symbol.toLowerCase()}lsk`.toUpperCase()} tick price table after ${tickTimestamp}`,
	);

	// NOTE: since lskusd data is retrieved from external source, we don't need to delete it

	// const lskUsdTickPriceTable = await getTickPriceTable('lskusd');
	// await lskUsdTickPriceTable.delete(
	// 	{ propBetweens: [{ property: 'time', greaterThan: tickTimestamp }] },
	// 	dbTrx,
	// );
	// logger.info(`Deleted LSKUSD tick price table after ${tickTimestamp}`);
};

const deleteOhlcPriceIndex = async (token, block, dbTrx) => {
	await BluebirdPromise.map(
		OHLC_TIMEFRAMES,
		async timeframe => {
			const ohlcTimestamp = normalizeBlockTime(block.timestamp, timeframe);
			const ohlcPriceTable = await getOhlcPriceTable(`${token.symbol.toLowerCase()}lsk`, timeframe);

			await ohlcPriceTable.delete(
				{ propBetweens: [{ property: 'time', greaterThan: ohlcTimestamp }] },
				dbTrx,
			);

			logger.info(
				`Deleted ${`${token.symbol.toLowerCase()}lsk`.toUpperCase()} ohlc price table after ${ohlcTimestamp}`,
			);

			// NOTE: since lskusd data is retrieved from external source, we don't need to delete it

			// const lskUsdOhlcPriceTable = await getOhlcPriceTable('lskusd', timeframe);
			// await lskUsdOhlcPriceTable.delete(
			// 	{ propBetweens: [{ property: 'time', greaterThan: ohlcTimestamp }] },
			// 	dbTrx,
			// );
			// logger.info(`Deleted LSKUSD ohlc price table after ${ohlcTimestamp}`);
		},
		{ concurrency: OHLC_TIMEFRAMES.length },
	);
};

const indexPreviousLSKUSDTickPriceQueue = Queue(
	config.endpoints.cache,
	config.queue.indexPreviousLSKUSDTickPrice.name,
	indexPreviousLSKUSDTickPrice,
	config.queue.indexPreviousLSKUSDTickPrice.concurrency,
);

const indexPreviousLSKUSDOhlcPriceQueue = Queue(
	config.endpoints.cache,
	config.queue.indexPreviousLSKUSDOhlcPrice.name,
	indexPreviousLSKUSDOhlcPrice,
	config.queue.indexPreviousLSKUSDOhlcPrice.concurrency,
);

const indexCurrentLSKUSDPriceQueue = Queue(
	config.endpoints.cache,
	config.queue.indexCurrentLSKUSDPrice.name,
	indexCurrentLSKUSDPrice,
	config.queue.indexCurrentLSKUSDPrice.concurrency,
);

// eslint-disable-next-line no-unused-vars
const addPriceIndex = async (block, dbTrx) => {
	const tokenTable = await getDEXTokenTable();
	const lskTokenId = await getLSKTokenID();
	const registeredDexTokens = await tokenTable.find();

	await BluebirdPromise.map(
		registeredDexTokens,
		async token => {
			if (token.tokenId !== lskTokenId) {
				await indexTokenPrice(block.timestamp, token.tokenId, lskTokenId, dbTrx);
			}
		},
		{ concurrency: INDEX_TOKEN_CONCURRENCY },
	);

	indexCurrentLSKUSDPriceQueue.add({ timestamp: block.timestamp });

	const time = normalizeBlockTime(block.timestamp, LAST_PRICE_INTERVAL);
	await updateLastPrice(lskTokenId, 'lskusd', time, dbTrx);
};

const addGenesisPriceIndex = async (block, dbTrx) => {
	const currentTimestamp = Math.floor(Date.now() / 1000);
	const blockTimestamp = block.timestamp;

	logger.info(`Start indexing LSKUSD price from ${blockTimestamp} to ${currentTimestamp}`);

	for (
		let i = blockTimestamp;
		i < currentTimestamp;
		i += intervalToSecond[TICK_TIMEFRAME] * MAX_PREVIOUS_LSKUSD_INDEX_BATCH
	) {
		const tickFrom = normalizeBlockTime(i, TICK_TIMEFRAME);
		const tickTo =
			tickFrom + intervalToSecond[TICK_TIMEFRAME] * MAX_PREVIOUS_LSKUSD_INDEX_BATCH - 1;
		indexPreviousLSKUSDTickPriceQueue.add({ from: tickFrom, to: tickTo, dbTrx });
	}

	OHLC_TIMEFRAMES.forEach(timeframe => {
		for (
			let i = blockTimestamp;
			i < currentTimestamp;
			i += intervalToSecond[timeframe] * MAX_PREVIOUS_LSKUSD_INDEX_BATCH
		) {
			const ohlcFrom = normalizeBlockTime(i, timeframe);
			const ohlcTo = ohlcFrom + intervalToSecond[timeframe] * MAX_PREVIOUS_LSKUSD_INDEX_BATCH - 1;
			indexPreviousLSKUSDOhlcPriceQueue.add({ from: ohlcFrom, to: ohlcTo, timeframe, dbTrx });
		}
	});
};

const deletePriceIndex = async (block, dbTrx) => {
	const tokenTable = await getDEXTokenTable();
	const lskTokenId = await getLSKTokenID();
	const registeredDexTokens = await tokenTable.find({}, ['symbol']);

	await BluebirdPromise.map(
		registeredDexTokens,
		async token => {
			await deleteTickPriceIndex(token, block, dbTrx);
			await deleteOhlcPriceIndex(token, block, dbTrx);
			await indexTokenLastPrice(block.timestamp, token, lskTokenId, dbTrx);
		},
		{ concurrency: INDEX_TOKEN_CONCURRENCY },
	);

	const time = normalizeBlockTime(block.timestamp, LAST_PRICE_INTERVAL);
	await updateLastPrice(lskTokenId, 'lskusd', time, dbTrx);
};

module.exports = { addPriceIndex, deletePriceIndex, addGenesisPriceIndex };
