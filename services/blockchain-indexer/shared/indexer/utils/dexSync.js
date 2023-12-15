const {
	Logger,
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const logger = Logger();

const poolTableSchema = require('../../database/schema/pool');
const dexTokenTableSchema = require('../../database/schema/registeredDexToken');

const config = require('../../../config');
const { invokeEndpoint } = require('../../dataService');
const { decodePoolAddress } = require('./poolAddress');
const { decodePriceSqrt } = require('./priceFormatter');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const syncPoolData = async poolAddress => {
	const poolTable = await getPoolTable();
	const tokenTable = await getDEXTokenTable();
	const pool = decodePoolAddress(poolAddress);

	const [token0] = await tokenTable.find({ tokenId: pool.token0, limit: 1 }, ['decimal']);
	const [token1] = await tokenTable.find({ tokenId: pool.token1, limit: 1 }, ['decimal']);

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
			price: decodePriceSqrt(poolData.data.slot0.sqrtPriceX96, token0.decimal, token1.decimal),
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
			price: decodePriceSqrt(
				poolData.data.slot0.sqrtPriceX96,
				token0.decimal,
				token1.decimal,
				true,
			),
		},
	});

	logger.debug(`Synced pool with node: ${poolAddress}`);
};

module.exports = { syncPoolData };
