module.exports = {
	tableName: 'tvl',
	primaryKey: ['transactionId', 'index'],
	schema: {
		transactionId: { type: 'string' },
		index: { type: 'integer' },
		time: { type: 'integer' },
		sender: { type: 'string' },
		poolAddress: { type: 'string' },
		amount: { type: 'decimal', precision: 40, scale: 0 },
		tokenId: { type: 'string' },
	},
	indexes: {
		time: { type: 'key' },
		sender: { type: 'key' },
		poolAddress: { type: 'key' },
	},
	purge: {},
};
