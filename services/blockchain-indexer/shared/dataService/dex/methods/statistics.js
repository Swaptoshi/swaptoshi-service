const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');

const dexTokenTableSchema = require('../../../database/schema/registeredDexToken');

const config = require('../../../../config');
const { getLSKUSDLastPrice } = require('../lskPrices');
const { parseQueryResult } = require('../../../utils/query');
const { getLSKTokenID } = require('../../business/interoperability/blockchainApps');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const getDEXStatisticSummary = async params => {
	const lskusdprice = await getLSKUSDLastPrice();
	const registeredDexTokenTable = await getDEXTokenTable();
	const lskTokenId = await getLSKTokenID();
	const { start, end } = params;

	const query = `
        SELECT
            COALESCE(SUM(vol.volume * vol.priceUSD), 0) AS totalVolumeUSD,
            COALESCE(SUM(vol.feeGrowth * vol.priceUSD), 0) AS totalFeeGrowthUSD,
            COALESCE(SUM(vol.swapCount), 0) AS swapCount,
            COALESCE((SELECT COUNT(DISTINCT poolAddress) FROM pool WHERE 1 = 1 ${
							start ? `AND created >= ${start}` : ''
						} ${end ? `AND created <= ${end}` : ''}), 0) AS totalPoolCount,
            COALESCE(SUM(vl.amount * vol.priceUSD), 0) AS totalTvlUSD
        FROM
            registered_dex_token rdt
        LEFT JOIN (
            SELECT
                t.tokenId,
                p.poolAddress,
                COUNT(DISTINCT CONCAT(v.height, '_', v.index)) AS swapCount,
                SUM(CASE WHEN p.token0 = t.tokenId THEN ABS(v.amount0) ELSE ABS(v.amount1) END) / POWER(10, t.decimal) AS volume,
                SUM(CASE WHEN p.token0 = t.tokenId THEN v.feeGrowth0 ELSE v.feeGrowth1 END) / POWER(10, t.decimal) AS feeGrowth,
                COALESCE((CASE WHEN t.tokenId = '${lskTokenId}' THEN 1 ELSE lp.current END) * ${
		lskusdprice.current || 0
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
                tokenId
        ) AS vol ON rdt.tokenId = vol.tokenId
        LEFT JOIN (
            SELECT
                tvl.tokenId,
                poolAddress,
                SUM(amount) / POWER(10, t.decimal) as amount
            FROM tvl
            LEFT JOIN registered_dex_token t ON t.tokenId = tvl.tokenId
            WHERE
                1 = 1 ${start ? `AND time >= ${start}` : ''} ${end ? `AND time <= ${end}` : ''}
            GROUP BY
                tokenId
        ) AS vl ON rdt.tokenId = vl.tokenId;`;

	const response = {
		data: {},
		meta: {},
	};

	const summary = parseQueryResult(await registeredDexTokenTable.rawQuery(query));

	// eslint-disable-next-line prefer-destructuring
	response.data = summary[0];
	response.meta = {};
	return response;
};

module.exports = { getDEXStatisticSummary };
