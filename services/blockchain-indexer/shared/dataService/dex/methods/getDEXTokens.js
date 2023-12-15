const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const dexTokenTableSchema = require('../../../database/schema/registeredDexToken');

const config = require('../../../../config');
const { getLSKUSDLastPrice } = require('../lskPrices');
const { parseQueryResult } = require('../../../utils/query');
const { getLSKTokenID } = require('../../business/interoperability/blockchainApps');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const getDEXTokens = async params => {
	const registeredDexTokenTable = await getDEXTokenTable();
	const isCompact = params.compact === true;
	const searchTerm = params.search ? params.search.trim() : '';
	const offset = params.offset || 0;
	const limit = params.limit || 10;

	let query = '';
	const limitQuery = params.limit === -1 ? '' : `LIMIT ${limit}`;
	const offsetQuery = params.limit === -1 ? '' : `OFFSET ${offset}`;

	if (isCompact) {
		const searchCondition =
			searchTerm !== ''
				? `WHERE
					tokenName LIKE '%${searchTerm}%' OR
					tokenId LIKE '%${searchTerm}%' OR
					symbol LIKE '%${searchTerm}%'`
				: '';

		query = `
				SELECT 
					COALESCE(tm.tokenID, tf.tokenID) AS tokenId,
					COALESCE(rdt.symbol, tf.symbol) AS symbol,
					COALESCE(tm.tokenName, tf.tokenName) AS tokenName,
					COALESCE(rdt.logo, tf.logoPng) AS logo,
					COALESCE(rdt.decimal, tf.decimal) AS \`decimal\`
				FROM registered_dex_token AS rdt
				LEFT JOIN token_metadata AS tm ON rdt.tokenId = tm.tokenID
				LEFT JOIN token_factory AS tf ON tm.tokenID = tf.tokenID
				${searchCondition}
				${limitQuery} ${offsetQuery};
				`;
	} else {
		const lskusdprice = await getLSKUSDLastPrice();
		const lskTokenId = await getLSKTokenID();
		const changeWindow = params.changeWindow || '24h';
		const { start, end } = params;

		const searchCondition =
			searchTerm !== ''
				? `WHERE 
					v.tokenName LIKE '%token%' 
					OR v.tokenId LIKE '%token%' 
					OR v.symbol LIKE '%token%'`
				: '';

		const sortBy =
			// eslint-disable-next-line no-nested-ternary
			params.sortBy &&
			[
				'tokenId',
				'symbol',
				'tokenName',
				'decimal',
				'volume',
				'volumeUSD',
				'feeGrowth',
				'feeGrowthUSD',
				'txCount',
				'poolCount',
				'totalTvl',
				'totalTvlUSD',
				'price',
				'priceUSD',
				'priceChange',
				'priceChangeUSD',
			].includes(params.sortBy)
				? `v.${params.sortBy}`
				: 'v.volumeUSD';

		const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';

		query = `
			SELECT 
				* 
			FROM 
				(
				SELECT 
					rdt.tokenId, 
					COALESCE(rdt.symbol, tf.symbol) AS symbol, 
					COALESCE(tm.tokenName, tf.tokenName) AS tokenName, 
					COALESCE(rdt.logo, tf.logoPng) AS logo, 
					COALESCE(rdt.decimal, tf.decimal) AS \`decimal\`, 
					vol.volume AS volume, 
					vol.volume * vol.priceUSD AS volumeUSD, 
					vol.feeGrowth AS feeGrowth, 
					vol.feeGrowth * vol.priceUSD AS feeGrowthUSD, 
					vol.swapCount AS swapCount, 
					COUNT(pool.poolAddress) AS poolCount, 
					vl.amount AS totalTvl, 
					vl.amount * vol.priceUSD AS totalTvlUSD, 
					COALESCE(CASE WHEN rdt.tokenId = '${lskTokenId}' THEN 1 ELSE lp.current END, 0) AS price, 
					vol.priceUSD AS priceUSD, 
					COALESCE((lp.current - lp.${changeWindow}) / lp.${changeWindow} * 100, 0) AS priceChange, 
					COALESCE(((lp.current * ${lskusdprice.current || 0}) - (lp.${changeWindow} * ${
			lskusdprice[changeWindow] || 0
		})) / (lp.${changeWindow} * ${lskusdprice[changeWindow] || 0}) * 100, 0) AS priceChangeUSD 
				FROM 
					registered_dex_token rdt 
					LEFT JOIN (
						SELECT 
							t.tokenId, 
							v.height, 
							v.index, 
							COUNT(DISTINCT CONCAT(v.height, '_', v.index)) AS swapCount, 
							SUM(CASE WHEN p.token0 = t.tokenId THEN ABS(v.amount0) ELSE ABS(v.amount1) END) / POWER(10, t.decimal) AS volume, 
							SUM(CASE WHEN p.token0 = t.tokenId THEN v.feeGrowth0 ELSE v.feeGrowth1 END) / POWER(10, t.decimal) AS feeGrowth, 
							COALESCE((CASE WHEN t.tokenId = '${lskTokenId}' THEN 1 ELSE lp.current END) * ${
			lskusdprice.current
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
					) AS vol ON rdt.tokenId = vol.tokenId 
					LEFT JOIN token_metadata AS tm ON rdt.tokenId = tm.tokenID 
					LEFT JOIN token_factory AS tf ON tm.tokenID = tf.tokenID 
					LEFT JOIN (
						SELECT 
							tvl.tokenId, 
							SUM(amount) / POWER(10, t.decimal) as amount 
						FROM 
							tvl 
						LEFT JOIN registered_dex_token t ON t.tokenId = tvl.tokenId
						WHERE 
                            1 = 1 ${start ? `AND time >= ${start}` : ''} ${
			end ? `AND time <= ${end}` : ''
		}
						GROUP BY 
							tokenId
						) AS vl ON vl.tokenId = rdt.tokenId 
					LEFT JOIN last_price lp ON rdt.tokenId = lp.tokenId 
					LEFT JOIN pool ON pool.token0 = rdt.tokenId 
				GROUP BY 
					rdt.tokenId
				) v 
			${searchCondition}
			ORDER BY 
				${sortBy} ${sortOrder} 
			${limitQuery} ${offsetQuery};`;
	}

	const response = {
		data: {},
		meta: {},
	};

	const tokens = parseQueryResult(await registeredDexTokenTable.rawQuery(query));

	response.data = tokens;
	response.meta = {
		count: tokens.length,
		offset,
		total: await registeredDexTokenTable.count(),
	};
	return response;
};

module.exports = { getDEXTokens };
