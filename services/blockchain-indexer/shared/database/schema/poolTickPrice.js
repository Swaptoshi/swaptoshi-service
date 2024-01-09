module.exports = {
	tableName: 'pool_tick_price',
	primaryKey: ['tick'],
	schema: {
		tick: { type: 'integer' },
		price0: { type: 'string' },
		price1: { type: 'string' },
	},
	indexes: {
		tick: { type: 'key' },
	},
	purge: {},
};
