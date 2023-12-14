module.exports = {
	tableName: 'last_price',
	primaryKey: ['tokenId'],
	schema: {
		tokenId: { type: 'string' },
		updatedOn: { type: 'integer' },
		current: { type: 'decimal', precision: 40, scale: 0 },
		'1h': { type: 'decimal', precision: 40, scale: 0 },
		'24h': { type: 'decimal', precision: 40, scale: 0 },
		'7d': { type: 'decimal', precision: 40, scale: 0 },
		'30d': { type: 'decimal', precision: 40, scale: 0 },
		'1y': { type: 'decimal', precision: 40, scale: 0 },
	},
	indexes: {
		tokenId: { type: 'key' },
		updatedOn: { type: 'key' },
	},
	purge: {},
};
