module.exports = {
	tableName: 'pool',
	primaryKey: ['token0', 'token1', 'fee'],
	schema: {
		token0: { type: 'string' },
		token1: { type: 'string' },
		fee: { type: 'integer' },
		inverted: { type: 'boolean' },
		created: { type: 'integer' },
		poolAddress: { type: 'string' },
		collectionId: { type: 'string' },
		feeHex: { type: 'string' },
		tickSpacing: { type: 'integer' },
		tick: { type: 'integer' },
		liquidity: { type: 'decimal', precision: 40, scale: 0 },
		price: { type: 'decimal', precision: 50, scale: 8 },
	},
	indexes: {
		poolAddress: { type: 'key' },
		collectionId: { type: 'key' },
		created: { type: 'key' },
		token0: { type: 'key' },
		token1: { type: 'key' },
		fee: { type: 'key' },
		inverted: { type: 'key' },
	},
	purge: {},
};
