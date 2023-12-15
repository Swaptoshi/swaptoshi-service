const {
	Logger,
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const logger = Logger();

const poolTableSchema = require('../../database/schema/pool');

const config = require('../../../config');
const { invokeEndpoint } = require('../../dataService');
const { decodePoolAddress } = require('./poolAddress');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);

const syncPoolData = async poolAddress => {
	const poolTable = await getPoolTable();
	const pool = decodePoolAddress(poolAddress);

	const poolData = await invokeEndpoint({
		endpoint: 'dex_getPool',
		params: {
			tokenA: pool.token0,
			tokenB: pool.token1,
			fee: pool.fee,
		},
	});

	await poolTable.update({
		where: {
			poolAddress,
			inverted: false,
		},
		updates: {
			liquidity: poolData.data.liquidity,
			tick: poolData.data.slot0.tick,
		},
	});

	await poolTable.update({
		where: {
			poolAddress,
			inverted: true,
		},
		updates: {
			liquidity: poolData.data.liquidity,
			tick: poolData.data.slot0.tick,
		},
	});

	logger.debug(`Synced pool with node: ${poolAddress}`);
};

module.exports = { syncPoolData };
