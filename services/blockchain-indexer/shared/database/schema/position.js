module.exports = {
	tableName: 'position',
	primaryKey: ['tokenId'],
	schema: {
		tokenId: { type: 'string' },
		collectionId: { type: 'string' },
		owner: { type: 'string', null: true, default: null },
		name: { type: 'string' },
		description: { type: 'text' },
		image: { type: 'text' },
		tickUpper: { type: 'integer' },
		tickLower: { type: 'integer' },
		liquidity: { type: 'decimal', precision: 40, scale: 0 },
		tokenURI: { type: 'string' },
	},
	indexes: {
		tokenId: { type: 'key' },
		collectionId: { type: 'key' },
		owner: { type: 'key' },
	},
	purge: {},
};
