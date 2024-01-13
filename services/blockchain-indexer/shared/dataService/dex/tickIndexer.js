const {
	Logger,
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');
const BluebirdPromise = require('bluebird');
const config = require('../../../config');

const logger = Logger();

const poolTickPriceTableSchema = require('../../database/schema/poolTickPrice');
const poolTableSchema = require('../../database/schema/pool');
const { getPoolTickTableSchema } = require('../../database/dynamic-schema/poolTick');
const { getTicksJson } = require('../../database/database-data/ticks');

const MYSQL_ENDPOINT = config.endpoints.mysql;
const INITIALIZATION_CONCURRENCY = 8;
const MIN_TICK = -887272;
const MAX_TICK = 887272;

const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);

const getPoolTickPriceTable = () =>
	getTableInstance(poolTickPriceTableSchema.tableName, poolTickPriceTableSchema, MYSQL_ENDPOINT);

const getPoolTickTable = poolAddress =>
	getTableInstance(
		getPoolTickTableSchema(poolAddress).tableName,
		getPoolTickTableSchema(poolAddress),
		MYSQL_ENDPOINT,
	);

const initializeTickTable = async dbTrx => {
	const poolTickPriceTable = await getPoolTickPriceTable();

	await BluebirdPromise.map(
		getTicksJson(),
		async ticks => {
			await poolTickPriceTable.upsert(ticks, dbTrx);
		},
		{ concurrency: INITIALIZATION_CONCURRENCY },
	);

	logger.info('Tick price table list initialized');
};

const initializePoolTickTable = async (poolAddress, dbTrx) => {
	const poolTickTable = await getPoolTickTable(poolAddress);
	const count = await poolTickTable.count();
	if (count > 0) return;

	const poolTable = await getPoolTable();
	const pool = await poolTable.find({ poolAddress, limit: 1 }, ['tickSpacing']);
	if (!pool) throw new Error('pool doesnt exists');
	const { tickSpacing } = pool[0];

	const minTickNormalized = MIN_TICK - (MIN_TICK % Number(tickSpacing)) + Number(tickSpacing);
	const maxTickNormalized = MAX_TICK - (MAX_TICK % Number(tickSpacing));

	const ticksToBeIndexed = [];

	for (let i = minTickNormalized; i <= maxTickNormalized; i += tickSpacing) {
		ticksToBeIndexed.push(i);
	}

	await BluebirdPromise.map(
		ticksToBeIndexed,
		async tick => {
			await poolTickTable.upsert({ tick, liquidity: 0 }, dbTrx);
		},
		{ concurrency: INITIALIZATION_CONCURRENCY },
	);

	logger.info(`Tick table for pool: ${poolAddress}, successfully initialized`);
};

const increasePoolTickLiquidity = async (poolAddress, tickLower, tickUpper, liquidity, dbTrx) => {
	const poolTickTable = await getPoolTickTable(poolAddress);

	const query = `
		UPDATE 
			${getPoolTickTableSchema(poolAddress).tableName} 
		SET 
			liquidity = liquidity + ${liquidity} 
		WHERE 
			tick >= ${tickLower} 
			AND tick <= ${tickUpper}`;

	await poolTickTable.rawQuery(query, dbTrx);

	logger.info(
		`Successfully incremented liquidity for pool ${poolAddress} from ${tickLower} to ${tickUpper} with liquidity ${liquidity}`,
	);
};

const decreasePoolTickLiquidity = async (poolAddress, tickLower, tickUpper, liquidity, dbTrx) => {
	const poolTickTable = await getPoolTickTable(poolAddress);

	const query = `
		UPDATE 
			${getPoolTickTableSchema(poolAddress).tableName} 
		SET 
			liquidity = liquidity - ${liquidity} 
		WHERE 
			tick >= ${tickLower} 
			AND tick <= ${tickUpper}`;

	await poolTickTable.rawQuery(query, dbTrx);

	logger.info(
		`Successfully decremented liquidity for pool ${poolAddress} from ${tickLower} to ${tickUpper} with liquidity ${liquidity}`,
	);
};

module.exports = {
	initializeTickTable,
	initializePoolTickTable,
	increasePoolTickLiquidity,
	decreasePoolTickLiquidity,
};
