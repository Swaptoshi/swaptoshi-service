const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const config = require('../../../../config');
const { parseQueryResult } = require('../../../utils/query');
const { getPoolTickTableSchema } = require('../../../database/dynamic-schema/poolTick');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getPoolTickTable = poolAddress =>
	getTableInstance(
		getPoolTickTableSchema(poolAddress).tableName,
		getPoolTickTableSchema(poolAddress),
		MYSQL_ENDPOINT,
	);

const getPoolTicks = async params => {
	const poolTickTable = await getPoolTickTable();

	const { poolAddress, tickLower, tickUpper, interval } = params;

	const sortBy =
		params.sortBy && ['price0', 'price1'].includes(params.sortBy)
			? `ptp.${params.sortBy}`
			: 'ptp.price0';

	const query = `
		SELECT 
			tp.tick,
			ptp.price0,
			ptp.price1,
			tp.liquidity 
		FROM 
			tick_pool_${poolAddress} AS tp
		LEFT JOIN 
			pool_tick_price AS ptp 
			ON tp.tick = ptp.tick 
		WHERE 
			tp.tick >= ${tickLower} 
			AND tp.tick <= ${tickUpper} 
			${interval ? `AND MOD(tp.tick, ${interval}) = 0` : ''} 
		ORDER BY ${sortBy} ASC`;

	const response = {
		data: {},
		meta: {},
	};

	const ticks = parseQueryResult(await poolTickTable.rawQuery(query));

	response.data = ticks;
	response.meta = {};
	return response;
};

module.exports = { getPoolTicks };
