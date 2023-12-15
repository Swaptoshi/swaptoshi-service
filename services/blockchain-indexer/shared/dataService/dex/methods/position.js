/* eslint-disable prefer-destructuring */
const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');
const cryptography = require('@liskhq/lisk-cryptography');

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
			'tickUpper',
			'liquidity',
		].includes(params.sortBy)
			? ['poolAddress', 'token0', 'token1'].includes(params.sortBy)
				? `pool.${params.sortBy}`
				: `pos.${params.sortBy}`
			: 'pos.tokenId';

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
            pool.token0,
            pool.token1,
            pos.tokenId,
            pos.owner,
            pos.collectionId,
            pos.tickLower,
            pos.tickUpper,
            pos.liquidity
        FROM position pos
            LEFT JOIN pool ON pool.inverted = false AND pool.collectionId = pos.collectionId
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
            pool.poolAddress,
        FROM position pos
            LEFT JOIN pool ON pool.inverted = false AND pool.collectionId = pos.collectionId
        WHERE
            pos.tokenId = '${params.tokenId}'
        LIMIT 1;`;
	const [position] = parseQueryResult(await positionTable.rawQuery(query));

	const value = await invokeEndpoint({
		endpoint: 'dex_getPosition',
		params: {
			poolAddress: cryptography.address
				.getAddressFromLisk32Address(position.poolAddress)
				.toString('hex'),
			tokenId: index,
		},
	});

	const response = {
		data: {},
		meta: {},
	};

	response.data = value;
	response.meta = {};
	return response;
};

const getPositionMetadata = async params => {
	const positionTable = await getPositionTable();

	const query = `
        SELECT 
            pos.name,
            pos.description,
            pos.image
        FROM position pos
		WHERE pos.tokenId = '${params.tokenId}'
		LIMIT 1;`;

	const response = {
		data: {},
		meta: {},
	};

	const metadata = parseQueryResult(await positionTable.rawQuery(query));

	response.data = metadata;
	response.meta = {};
	return response;
};

module.exports = { getPositions, getPositionValue, getPositionMetadata };
