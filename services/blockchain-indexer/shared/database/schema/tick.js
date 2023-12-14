module.exports = {
	tableName: 'tick',
	primaryKey: ['poolAddress', 'tick'],
	schema: {
		poolAddress: { type: 'string' },
		tick: { type: 'integer' },
		liquidityNet: { type: 'decimal', precision: 40, scale: 0 },
	},
	indexes: {
		poolAddress: { type: 'key' },
		tick: { type: 'key' },
	},
	purge: {},
};
