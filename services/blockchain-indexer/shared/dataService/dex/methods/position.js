/* eslint-disable prefer-destructuring */
const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');

const positionTableSchema = require('../../../database/schema/position');

const config = require('../../../../config');
const { invokeEndpoint } = require('../../invoke');
const { decodeNFTId } = require('../../../indexer/utils/poolAddress');
const { parseQueryResult } = require('../../../utils/query');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getPositionTable = () =>
	getTableInstance(positionTableSchema.tableName, positionTableSchema, MYSQL_ENDPOINT);

const getPositions = async params => {
	const positionTable = await getPositionTable();

	const searchTerm = params.search ? params.search.trim() : '';
	const offset = params.offset || 0;
	const limit = params.limit || 10;

	const limitQuery = params.limit === -1 ? '' : `LIMIT ${limit}`;
	const offsetQuery = params.limit === -1 ? '' : `OFFSET ${offset}`;

	const sortBy =
		// eslint-disable-next-line no-nested-ternary
		params.sortBy &&
		[
			'poolAddress',
			'token0',
			'token1',
			'tokenId',
			'owner',
			'collectionId',
			'tickLower',
			'priceLower',
			'tickUpper',
			'priceUpper',
			'liquidity',
			'status',
		].includes(params.sortBy)
			? // eslint-disable-next-line no-nested-ternary
			  ['poolAddress', 'token0', 'token1'].includes(params.sortBy)
				? `pool.${params.sortBy}`
				: ['status'].includes(params.sortBy)
				? `status`
				: `pos.${params.sortBy}`
			: 'status';

	const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

	const searchCondition =
		searchTerm !== ''
			? `WHERE
					pool.poolAddress LIKE '%${searchTerm}%' OR
					pos.tokenId LIKE '%${searchTerm}%' OR
					pos.owner LIKE '%${searchTerm}%'`
			: '';

	const query = `
        SELECT 
            pool.poolAddress,
			pool.tick AS poolTick,
			pool.fee,
			t0.tokenId AS token0,
			t0.symbol AS token0Symbol,
			t0.logo AS token0Logo,
			t0.decimal AS token0Decimal,
			t1.tokenId AS token1,
			t1.symbol AS token1Symbol,
			t1.logo AS token1Logo,
			t1.decimal AS token1Decimal,
            pos.tokenId,
            pos.owner,
            pos.collectionId,
            pos.tickLower,
            pos.tickUpper,
            pos.liquidity,
			pos.tokenURI,
			CASE WHEN pos.liquidity = 0 THEN 0 WHEN pos.tickLower < pool.tick AND pool.tick < pos.tickUpper THEN 2 ELSE 1 END AS status
        FROM position pos
            LEFT JOIN pool ON pool.inverted = false AND pool.collectionId = pos.collectionId
			LEFT JOIN registered_dex_token t0 ON t0.tokenId = pool.token0
			LEFT JOIN registered_dex_token t1 ON t1.tokenId = pool.token1
        ${searchCondition}
		ORDER BY ${sortBy} ${sortOrder}
        ${limitQuery} ${offsetQuery};`;

	const response = {
		data: {},
		meta: {},
	};

	const ticks = parseQueryResult(await positionTable.rawQuery(query));

	response.data = ticks;
	response.meta = {
		count: ticks.length,
		offset,
		total: await positionTable.count(),
	};
	return response;
};

const getPositionValue = async params => {
	const positionTable = await getPositionTable();

	const { index } = decodeNFTId(params.tokenId);
	const query = `
        SELECT 
            pool.poolAddress
        FROM position pos
            LEFT JOIN pool ON pool.inverted = false AND pool.collectionId = pos.collectionId
        WHERE
            pos.tokenId = '${params.tokenId}'
        LIMIT 1;`;
	const [position] = parseQueryResult(await positionTable.rawQuery(query));

	const value = await invokeEndpoint({
		endpoint: 'dex_getPosition',
		params: {
			poolAddress: position.poolAddress,
			tokenId: index.toString(),
		},
	});

	const response = {
		data: {},
		meta: {},
	};

	response.data = value.data;
	response.meta = {};
	return response;
};

const getPositionMetadata = async params => {
	const positionTable = await getPositionTable();

	const query = `
        SELECT 
			COALESCE(pos.name, '') AS name,
            COALESCE(pos.description, '') AS description,
            COALESCE(pos.image, '') AS image
        FROM position pos
		WHERE pos.tokenId = '${params.tokenId}'
		LIMIT 1;`;

	const response = {
		data: {},
		meta: {},
	};

	const metadata = parseQueryResult(await positionTable.rawQuery(query));

	response.data = metadata[0];
	response.meta = {};
	return response;
};

module.exports = { getPositions, getPositionValue, getPositionMetadata };
