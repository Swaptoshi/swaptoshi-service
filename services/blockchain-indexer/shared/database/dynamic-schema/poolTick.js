const getPoolTickTableSchema = poolAddress => ({
	tableName: `tick_pool_${poolAddress}`,
	primaryKey: ['tick'],
	schema: {
		tick: { type: 'integer' },
		liquidity: { type: 'decimal', precision: 40, scale: 0 },
	},
	indexes: {
		tick: { type: 'key' },
	},
	purge: {},
});

module.exports = { getPoolTickTableSchema };
