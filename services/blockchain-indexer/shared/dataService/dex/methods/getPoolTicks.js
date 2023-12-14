const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const tickTableSchema = require('../../../database/schema/tick');

const config = require('../../../../config');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getTickTable = () =>
	getTableInstance(tickTableSchema.tableName, tickTableSchema, MYSQL_ENDPOINT);

const getPoolTicks = async params => {
	const tickTable = await getTickTable();

	const { poolAddress } = params;

	const query = `SELECT tick, liquidityNet FROM tick WHERE poolAddress = '${poolAddress}' ORDER BY tick ASC`;

	const response = {
		data: {},
		meta: {},
	};

	const ticks = await tickTable.rawQuery(query);

	response.data = ticks;
	response.meta = {};
	return response;
};

module.exports = { getPoolTicks };
