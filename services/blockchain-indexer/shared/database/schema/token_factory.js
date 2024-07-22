module.exports = {
	tableName: 'token_factory',
	primaryKey: ['transactionId'],
	schema: {
		transactionId: { type: 'string' },
		tokenID: { type: 'string' },
		owner: { type: 'string' },
		supply: { type: 'decimal', precision: 40, scale: 0 },
		tokenName: { type: 'string', null: true, default: null },
		description: { type: 'string', null: true, default: null },
		decimal: { type: 'integer', null: true, default: null },
		baseDenom: { type: 'string', null: true, default: null },
		symbol: { type: 'string', null: true, default: null },
		logoPng: { type: 'string', null: true, default: null },
		logoSvg: { type: 'string', null: true, default: null },
	},
	indexes: {
		transactionId: { type: 'key' },
		tokenID: { type: 'key' },
	},
	purge: {},
};
