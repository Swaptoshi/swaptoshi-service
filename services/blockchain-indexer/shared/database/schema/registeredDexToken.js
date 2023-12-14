module.exports = {
	tableName: 'registered_dex_token',
	primaryKey: ['tokenId'],
	schema: {
		tokenId: { type: 'string' },
		symbol: { type: 'string' },
		decimal: { type: 'integer' },
		logo: { type: 'string', null: true, defaultValue: null },
	},
	indexes: {
		tokenId: { type: 'key' },
		symbol: { type: 'key' },
	},
	purge: {},
};
