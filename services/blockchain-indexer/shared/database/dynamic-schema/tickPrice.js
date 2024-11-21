const getTickPriceTableSchema = pair => ({
	tableName: `tick_${pair}`,
	primaryKey: ['time'],
	schema: {
		time: { type: 'integer' },
		value: { type: 'decimal', precision: 50, scale: 8, null: true },
	},
	indexes: {
		time: { type: 'key' },
	},
	purge: {},
});

module.exports = { getTickPriceTableSchema };
