const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const dexTokenTableSchema = require('../../../database/schema/registeredDexToken');

const config = require('../../../../config');
const { getLSKUSDLastPrice } = require('../lskPrices');
const { parseQueryResult } = require('../../../utils/query');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const getDEXStatisticSummary = async params => {
	const lskusdprice = await getLSKUSDLastPrice();
	const registeredDexTokenTable = await getDEXTokenTable();
	const { start, end } = params;

	const query = `
        SELECT
            SUM(vol.volume * vol.priceUSD) AS totalVolumeUSD,
            SUM(vol.feeGrowth * vol.priceUSD) AS totalFeeGrowthUSD,
            SUM(vol.swapCount) AS swapCount,
            (SELECT COUNT(DISTINCT poolAddress) FROM pool) AS totalPoolCount,
            SUM(vl.amount * vol.priceUSD) AS totalTvlUSD
        FROM
            registered_dex_token rdt
        LEFT JOIN (
            SELECT
                t.tokenId,
                p.poolAddress,
                COUNT(DISTINCT CONCAT(v.height, '_', v.index)) AS swapCount,
                SUM(CASE WHEN p.token0 = t.tokenId THEN ABS(v.amount0) ELSE ABS(v.amount1) END) AS volume,
                SUM(CASE WHEN p.token0 = t.tokenId THEN v.feeGrowth0 ELSE v.feeGrowth1 END) AS feeGrowth,
                COALESCE(lp.current * ${lskusdprice.current || 0}, 0) AS priceUSD
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
                tokenId,
                poolAddress,
                SUM(amount) as amount
            FROM tvl
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
