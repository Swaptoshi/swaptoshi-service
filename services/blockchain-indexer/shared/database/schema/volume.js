module.exports = {
	tableName: 'volume',
	primaryKey: ['height', 'index'],
	schema: {
		height: { type: 'integer' },
		index: { type: 'integer' },
		poolAddress: { type: 'string' },
		sender: { type: 'string' },
		recipient: { type: 'string' },
		time: { type: 'integer' },
		amount0: { type: 'decimal', precision: 40, scale: 0 },
		amount1: { type: 'decimal', precision: 40, scale: 0 },
		feeGrowth0: { type: 'decimal', precision: 40, scale: 0 },
		feeGrowth1: { type: 'decimal', precision: 40, scale: 0 },
	},
	indexes: {
		poolAddress: { type: 'key' },
		sender: { type: 'key' },
		recipient: { type: 'key' },
		time: { type: 'key' },
	},
	purge: {},
};
