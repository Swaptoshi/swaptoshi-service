const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');

const poolTableSchema = require('../../../database/schema/pool');
const config = require('../../../../config');
const { getKLYUSDLastPrice } = require('../klyPrices');
const { parseQueryResult } = require('../../../utils/query');
const { getKLYTokenID } = require('../../business/interoperability/blockchainApps');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);

const getPools = async params => {
	const poolTable = await getPoolTable();
	const klyusdprice = await getKLYUSDLastPrice();
	const klyTokenId = await getKLYTokenID();

	const searchTerm = params.search ? params.search.trim() : '';
	const offset = params.offset || 0;
	const limit = params.limit || 10;
	const { start, end } = params;

	const limitQuery = params.limit === -1 ? '' : `LIMIT ${limit}`;
	const offsetQuery = params.limit === -1 ? '' : `OFFSET ${offset}`;

	const searchCondition =
		searchTerm !== ''
			? `AND (
					pool.poolAddress LIKE '%${searchTerm}%'
					OR pool.token0 LIKE '%${searchTerm}%'
					OR pool.token1 LIKE '%${searchTerm}%'
					OR pool.fee LIKE '%${searchTerm}%'
				)`
			: '';

	const sortBy =
		// eslint-disable-next-line no-nested-ternary
		params.sortBy &&
		[
			'poolAddress',
			'token0',
			'token1',
			'fee',
			'liquidity',
			'price',
			'feeGrowth0',
			'feeGrowth0USD',
			'feeGrowth1',
			'feeGrowth1USD',
			'token0Price',
			'token0PriceUSD',
			'token1Price',
			'token1PriceUSD',
			'tick',
			'volumeToken0',
			'volumeToken0USD',
			'volumeToken1',
			'volumeToken1USD',
			'swapCount',
			'totalTvlToken0',
			'totalTvlToken0USD',
			'totalTvlToken1',
			'totalTvlToken1USD',
			'positionCount',
		].includes(params.sortBy)
			? ['poolAddress', 'price'].includes(params.sortBy)
				? `pool.${params.sortBy}`
				: params.sortBy
			: 'pool.poolAddress';

	const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

	const query = `
			WITH token_volume AS (
					SELECT
						t.tokenId,
						t.symbol,
						t.decimal,
						t.logo,
						v.height,
						v.index,
						COUNT(DISTINCT CONCAT(v.height, '_', v.index)) AS swapCount,
						SUM(CASE WHEN p.token0 = t.tokenId THEN ABS(v.amount0) ELSE ABS(v.amount1) END) / POWER(10, t.decimal) AS volume,
						SUM(CASE WHEN p.token0 = t.tokenId THEN v.feeGrowth0 ELSE v.feeGrowth1 END) / POWER(10, t.decimal) AS feeGrowth,
						(CASE WHEN t.tokenId = '${klyTokenId}' THEN 1 ELSE lp.current END) AS price,
						COALESCE((CASE WHEN t.tokenId = '${klyTokenId}' THEN 1 ELSE lp.current END) * ${
		klyusdprice.current
	}, 0) AS priceUSD
					FROM
						registered_dex_token t
						JOIN pool p ON p.inverted = false
						AND (t.tokenId = p.token0 OR t.tokenId = p.token1)
						LEFT JOIN volume v ON p.poolAddress = v.poolAddress
						LEFT JOIN last_price lp ON t.tokenId = lp.tokenId
					WHERE
						1 = 1 ${start ? `AND v.time >= ${start}` : ''} ${end ? `AND v.time <= ${end}` : ''}
					GROUP BY
						t.tokenId
				),
				token_tvl AS (
					SELECT
						tvl.tokenId,
						SUM(amount) / POWER(10, t.decimal) as amount
					FROM tvl
					LEFT JOIN registered_dex_token t ON t.tokenId = tvl.tokenId
					GROUP BY tokenId
				)
			SELECT
				pool.poolAddress,
				token0,
				vol0.decimal AS token0Decimal,
				vol0.symbol AS token0Symbol,
				vol0.logo AS token0Logo,
				token1,
				vol1.decimal AS token1Decimal,
				vol1.symbol AS token1Symbol,
				vol1.logo AS token1Logo,
				fee,
				liquidity,
				pool.price,
				tick,
				vol0.feeGrowth AS feeGrowth0,
				vol0.feeGrowth * vol0.priceUSD AS feeGrowth0USD,
				vol1.feeGrowth AS feeGrowth1,
				vol1.feeGrowth * vol1.priceUSD AS feeGrowth1USD,
				vol0.price AS token0Price,
				vol0.price * vol0.priceUSD AS token0PriceUSD,
				vol1.price AS token1Price,
				vol1.price * vol0.priceUSD AS token1PriceUSD,
				vol0.volume AS volumeToken0,
				vol0.volume * vol0.priceUSD AS volumeToken0USD,
				vol1.volume AS volumeToken1,
				vol1.volume * vol1.priceUSD AS volumeToken1USD,
				COUNT(DISTINCT CONCAT(v.height, '_', v.index)) AS swapCount,
				tvl0.amount AS totalTvlToken0,
				tvl0.amount * vol0.priceUSD AS totalTvlToken0USD,
				tvl1.amount AS totalTvlToken1,
				tvl1.amount * vol1.priceUSD AS totalTvlToken1USD,
				pos.positionCount
			FROM pool
				LEFT JOIN token_volume AS vol0 ON pool.token0 = vol0.tokenId
				LEFT JOIN token_volume AS vol1 ON pool.token1 = vol1.tokenId
				LEFT JOIN volume AS v ON v.poolAddress = pool.poolAddress
				LEFT JOIN token_tvl AS tvl0 ON pool.token0 = tvl0.tokenId
				LEFT JOIN token_tvl AS tvl1 ON pool.token1 = tvl1.tokenId
				LEFT JOIN (
					SELECT
						collectionId,
						COUNT(collectionId) AS positionCount
					FROM position
					GROUP BY
						collectionId
				) AS pos ON pool.collectionId = pos.collectionId
			WHERE
				inverted = false
				${searchCondition}
			GROUP BY pool.poolAddress
			ORDER BY ${sortBy} ${sortOrder}
			${limitQuery} ${offsetQuery};`;

	const response = {
		data: {},
		meta: {},
	};

	const pools = parseQueryResult(await poolTable.rawQuery(query));

	response.data = pools;
	response.meta = {
		count: pools.length,
		offset,
		total: (await poolTable.count()) / 2,
	};
	return response;
};

module.exports = { getPools };
