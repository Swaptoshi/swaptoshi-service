module.exports = {
	tableName: 'last_price',
	primaryKey: ['tokenId'],
	schema: {
		tokenId: { type: 'string' },
		updatedOn: { type: 'integer' },
		current: { type: 'decimal', precision: 8, scale: 4 },
		'1h': { type: 'decimal', precision: 8, scale: 4 },
		'24h': { type: 'decimal', precision: 8, scale: 4 },
		'7d': { type: 'decimal', precision: 8, scale: 4 },
		'30d': { type: 'decimal', precision: 8, scale: 4 },
		'1y': { type: 'decimal', precision: 8, scale: 4 },
	},
	indexes: {
		tokenId: { type: 'key' },
		updatedOn: { type: 'key' },
	},
	purge: {},
};
