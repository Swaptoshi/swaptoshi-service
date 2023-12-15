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
const { requestAppRegistry, requestConnector } = require('../../utils/request');
const { factoryMetadataSchema } = require('./schema');
const { nftStorageUploadQueue } = require('../nft.storage');
const { getLSKUSDLastPrice } = require('../dex');
const { parseQueryResult } = require('../../utils/query');

const getTokenFactoryTable = () => getTableInstance(tokenFactoryTableSchema, MYSQL_ENDPOINT);

const createTokenFactory = async params => {
	const response = {
		data: {},
		meta: {},
	};

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

	const tokenFactoryTable = await getTokenFactoryTable();
	const metadata = codec.decode(factoryMetadataSchema, Buffer.from(params.metadata, 'hex'));

	nftStorageUploadQueue.add({ data: params.logo });
	const logoCID = await IPFSHash.of(Buffer.from(params.logo, 'hex'), {
		cidVersion: 1,
		rawLeaves: true,
	});
	const logoPng = `https://${logoCID}.ipfs.nftstorage.link/`;
	response.data.logoCid = logoCID;

	await tokenFactoryTable.upsert({
		transactionId: transactionPost.transactionId,
		...metadata,
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
			COUNT(tf.tokenID) AS tokenCreated,
			SUM(tf.supply * lp.current) AS totalMarketCap,
			SUM(tf.supply * lp.current * ${lskusdprice.current || 0}) AS totalMarketCapUSD
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
		.split(',')
		.map(tokenId => `'${tokenId}'`)
		.join(',');

	const limitClause = params.limit !== undefined ? `LIMIT ${params.limit}` : '';
	const offsetClause = params.offset !== undefined ? `OFFSET ${params.offset}` : '';

	const query = `
		SELECT
			tf.tokenID,
			tf.owner,
			tf.supply,
			lp.current AS price,
			lp.current * ${lskusdprice.current || 0} AS priceUSD,
			tf.supply * lp.current AS marketCap,
			tf.supply * lp.current * ${lskusdprice.current || 0} AS marketCapUSD
		FROM
			token_factory AS tf
		JOIN
			last_price AS lp ON tf.tokenID = lp.tokenId
		WHERE
			tf.tokenID IN (${tokenIdsString})
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
	const factories = await tokenFactoryTable
		.find({
			whereIn: [
				{
					property: 'tokenID',
					values: params.tokenIds.split(','),
				},
			],
			offset: params.offset,
			limit: params.limit,
		})
		.map(f => ({
			chainID: nodeInfo.chainID,
			chainName: 'Swaptoshi',
			tokenID: f.tokenID,
			tokenName: f.tokenName,
			networkType: 'mainnet',
			description: f.description,
			denomUnits: [
				{
					denom: f.baseDenom.toLowerCase(),
					decimals: 0,
					aliases: [f.baseDenom.charAt(0).toUpperCase() + f.baseDenom.slice(1)],
				},
				{
					denom: f.symbol.toLowerCase(),
					decimals: f.decimal,
					aliases: [f.tokenName.charAt(0).toUpperCase() + f.tokenName.slice(1)],
				},
			],
			symbol: f.symbol.toUpperCase(),
			displayDenom: f.symbol.toLowerCase(),
			baseDenom: f.baseDenom.toLowerCase(),
			logo: {
				png: f.logoPng,
				svg: '',
			},
		}))
		.concat(
			params.registry
				? (
						await requestAppRegistry('blockchain.apps.meta.tokens', {
							tokenID: params.tokenIds,
						})
				  ).data
				: [],
		);

	response.data = factories;
	response.meta = {
		count: factories.length,
		offset: params.offset,
		total: await tokenFactoryTable.count(),
	};
	return response;
};

module.exports = {
	createTokenFactory,
	getTokenFactoriesMeta,
	getFactoryStatistics,
	getTokenFactories,
};
