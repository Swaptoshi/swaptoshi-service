module.exports = {
	tableName: 'last_price',
	primaryKey: ['tokenId'],
	schema: {
		tokenId: { type: 'string' },
		updatedOn: { type: 'integer' },
		current: { type: 'decimal', precision: 50, scale: 8 },
		'1h': { type: 'decimal', precision: 50, scale: 8 },
		'24h': { type: 'decimal', precision: 50, scale: 8 },
		'7d': { type: 'decimal', precision: 50, scale: 8 },
		'30d': { type: 'decimal', precision: 50, scale: 8 },
		'1y': { type: 'decimal', precision: 50, scale: 8 },
	},
	indexes: {
		tokenId: { type: 'key' },
		updatedOn: { type: 'key' },
	},
	purge: {},
};
