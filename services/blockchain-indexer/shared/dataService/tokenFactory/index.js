/* eslint-disable no-nested-ternary */
/* eslint-disable import/no-extraneous-dependencies */
const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');
const { codec } = require('@liskhq/lisk-codec');
const IPFSHash = require('ipfs-only-hash');

const config = require('../../../config');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const tokenFactoryTableSchema = require('../../database/schema/token_factory');
const dexTokenTableSchema = require('../../database/schema/registeredDexToken');

const { requestAppRegistry, requestConnector } = require('../../utils/request');
const { factoryMetadataSchema } = require('./schema');
const { nftStorageUploadQueue } = require('../nft.storage');
const { getLSKUSDLastPrice } = require('../dex');
const { parseQueryResult } = require('../../utils/query');

const getTokenFactoryTable = () => getTableInstance(tokenFactoryTableSchema, MYSQL_ENDPOINT);

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const isTokenAvailable = async params => {
	let available = true;

	const response = {
		data: {},
		meta: {},
	};

	const tokenFactoryTable = await getTokenFactoryTable();
	const registeredDexToken = await getDEXTokenTable();

	const tokenNameExist =
		(await tokenFactoryTable.find({ tokenName: params.tokenName, limit: 1 }, ['tokenName']))
			.length > 0;

	if (tokenNameExist) available = false;

	const symbolExist =
		(await tokenFactoryTable.find({ symbol: params.symbol.toUpperCase(), limit: 1 }, ['symbol']))
			.length > 0;

	if (symbolExist) available = false;

	const registryData = await requestAppRegistry('blockchain.apps.meta.tokens', {
		tokenName: params.tokenName,
	});

	if (registryData.data.length > 0) available = false;

	const dexTokenExist =
		(await registeredDexToken.find({ symbol: params.symbol.toUpperCase(), limit: 1 }, ['symbol']))
			.length > 0;

	if (dexTokenExist) available = false;

	response.data.available = available;

	return response;
};

const createTokenFactory = async params => {
	const response = {
		data: {},
		meta: {},
	};

	const tokenFactoryTable = await getTokenFactoryTable();
	const metadata = codec.decode(factoryMetadataSchema, Buffer.from(params.metadata, 'hex'));

	const available = await isTokenAvailable(params);
	if (!available.data.available) throw new Error('tokenName and/or symbol is not available');

	const dryRunResult = await requestConnector('dryRunTransaction', {
		transaction: params.transaction,
	});
	if (dryRunResult.result === -1) {
		throw new Error(dryRunResult.errorMessage);
	}

	const transactionPost = await requestConnector('postTransaction', {
		transaction: params.transaction,
	});
	response.data.message = 'Transaction payload was successfully passed to the network node.';
	response.data.transactionID = transactionPost.transactionId;

	nftStorageUploadQueue.add({ data: Buffer.from(params.logo, 'base64').toString('hex') });
	const logoCID = await IPFSHash.of(Buffer.from(params.logo, 'base64'), {
		cidVersion: 1,
		rawLeaves: true,
	});
	const logoPng = `https://${logoCID}.ipfs.nftstorage.link/`;
	response.data.logoCid = logoCID;

	await tokenFactoryTable.upsert({
		transactionId: transactionPost.transactionId,
		...metadata,
		symbol: metadata.symbol.toUpperCase(),
		logoPng,
	});

	return response;
};

const getFactoryStatistics = async () => {
	const response = {
		data: {},
		meta: {},
	};

	const tokenFactoryTable = await getTokenFactoryTable();
	const lskusdprice = await getLSKUSDLastPrice();

	const query = `
		SELECT
			COALESCE(COUNT(tf.tokenID), 0) AS tokenCreated,
			COALESCE(SUM(tf.supply * lp.current), 0) AS totalMarketCap,
			COALESCE(SUM(tf.supply * lp.current * ${lskusdprice.current || 0}), 0) AS totalMarketCapUSD
		FROM
			token_factory AS tf
		JOIN
			last_price AS lp ON tf.tokenID = lp.tokenId;
	`;

	const marketCap = parseQueryResult(await tokenFactoryTable.rawQuery(query));

	// eslint-disable-next-line prefer-destructuring
	response.data = marketCap[0];

	return response;
};

const getTokenFactories = async params => {
	const response = {
		data: {},
		meta: {},
	};

	const tokenFactoryTable = await getTokenFactoryTable();
	const lskusdprice = await getLSKUSDLastPrice();
	const tokenIdsString = params.tokenIds
		? params.tokenIds
				.split(',')
				.map(tokenId => `'${tokenId}'`)
				.join(',')
		: '';

	const searchQuery = tokenIdsString.length > 0 ? `AND tf.tokenID IN (${tokenIdsString})` : '';

	const limitClause = params.limit !== undefined ? `LIMIT ${params.limit}` : '';
	const offsetClause = params.offset !== undefined ? `OFFSET ${params.offset}` : '';

	const query = `
		SELECT
			tf.tokenID,
			tf.owner,
			tf.supply,
			lp.current AS price,
			lp.current * ${lskusdprice.current || 0} AS priceUSD,
			(tf.supply * lp.current) / POWER(10, tf.decimal) AS marketCap,
			(tf.supply * lp.current * ${lskusdprice.current || 0}) / POWER(10, tf.decimal) AS marketCapUSD
		FROM
			token_factory AS tf
		JOIN
			last_price AS lp ON tf.tokenID = lp.tokenId
		WHERE
			1 = 1 ${searchQuery}
		${limitClause}
		${offsetClause};
	`;

	const factories = parseQueryResult(await tokenFactoryTable.rawQuery(query));

	response.data = factories;
	response.meta = {
		count: factories.length,
		offset: params.offset,
		total: await tokenFactoryTable.count(),
	};

	return response;
};

const getTokenFactoriesMeta = async params => {
	const nodeInfo = await requestConnector('getNodeInfo');
	const response = {
		data: {},
		meta: {},
	};

	const tokenFactoryTable = await getTokenFactoryTable();

	const tokenIdsString = params.tokenIds
		? params.tokenIds
				.split(',')
				.map(tokenId => `'${tokenId}'`)
				.join(',')
		: '';

	const searchQuery = tokenIdsString.length > 0 ? `AND tf.tokenID IN (${tokenIdsString})` : '';

	const limitClause = params.limit !== undefined ? `LIMIT ${params.limit}` : '';
	const offsetClause = params.offset !== undefined ? `OFFSET ${params.offset}` : '';

	const query = `
		SELECT
			*
		FROM
			token_factory AS tf
		WHERE
			1 = 1 ${searchQuery}
		${limitClause}
		${offsetClause};
	`;

	const factoryData = parseQueryResult(await tokenFactoryTable.rawQuery(query));
	const registryData = await requestAppRegistry('blockchain.apps.meta.tokens', {
		tokenID: params.tokenIds,
	});

	const factories = factoryData
		.map(f => ({
			chainID: nodeInfo.chainID,
			chainName: 'swaptoshi_mainchain',
			tokenID: f.tokenID,
			tokenName: f.tokenName || '',
			networkType:
				f.tokenID.slice(0, 2) === '00'
					? 'mainnet'
					: f.tokenID.slice(0, 2) === '01'
					? 'testnet'
					: f.tokenID.slice(0, 2) === '04'
					? 'devnet'
					: 'unknown',
			description: f.description || '',
			denomUnits: [
				{
					denom: f.baseDenom ? f.baseDenom.toLowerCase() : '',
					decimals: 0,
					aliases: f.baseDenom ? [f.baseDenom.charAt(0).toUpperCase() + f.baseDenom.slice(1)] : [],
				},
				{
					denom: f.symbol ? f.symbol.toLowerCase() : '',
					decimals: f.decimal || 0,
					aliases: f.tokenName ? [f.tokenName.charAt(0).toUpperCase() + f.tokenName.slice(1)] : [],
				},
			],
			symbol: f.symbol ? f.symbol.toUpperCase() : '',
			displayDenom: f.symbol ? f.symbol.toLowerCase() : '',
			baseDenom: f.baseDenom ? f.baseDenom.toLowerCase() : '',
			logo: {
				png: f.logoPng ? f.logoPng : '',
				svg: '',
			},
		}))
		.concat(params.registry ? registryData.data : []);

	response.data = factories;
	response.meta = {
		count: factories.length,
		offset: params.offset || 0,
		total: await tokenFactoryTable.count(),
	};
	return response;
};

module.exports = {
	createTokenFactory,
	getTokenFactoriesMeta,
	getFactoryStatistics,
	getTokenFactories,
	isTokenAvailable,
};
