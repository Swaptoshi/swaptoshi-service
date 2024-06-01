const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');

const tickTableSchema = require('../../../database/schema/tick');

const config = require('../../../../config');
const { parseQueryResult } = require('../../../utils/query');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getTickTable = () =>
	getTableInstance(tickTableSchema.tableName, tickTableSchema, MYSQL_ENDPOINT);

const getPoolTicks = async params => {
	const tickTable = await getTickTable();

	const { poolAddress } = params;

	const query = `
		SELECT 
			t.tick,
			ptp.price0,
			ptp.price1, 
			t.liquidityNet 
		FROM 
			tick AS t
		LEFT JOIN
			pool_tick_price AS ptp ON ptp.tick = t.tick
		WHERE 
			t.poolAddress = '${poolAddress}' 
		ORDER BY 
			t.tick ASC`;

	const response = {
		data: {},
		meta: {},
	};

	const ticks = parseQueryResult(await tickTable.rawQuery(query));

	response.data = ticks;
	response.meta = {};
	return response;
};

module.exports = { getPoolTicks };
