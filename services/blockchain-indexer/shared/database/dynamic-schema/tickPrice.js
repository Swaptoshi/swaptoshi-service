const getTickPriceTableSchema = pair => ({
	tableName: `tick_${pair}`,
	primaryKey: ['time'],
	schema: {
		time: { type: 'integer' },
		value: { type: 'decimal', precision: 8, scale: 4, null: true },
	},
	indexes: {
		time: { type: 'key' },
	},
	purge: {},
});

module.exports = { getTickPriceTableSchema };
