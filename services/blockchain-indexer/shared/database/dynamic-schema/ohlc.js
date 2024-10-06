const getOhlcTableSchema = (pair, timeframe) => ({
	tableName: `ohlc_${pair}_${timeframe}`,
	primaryKey: ['time'],
	schema: {
		time: { type: 'integer' },
		open: { type: 'decimal', precision: 40, scale: 8 },
		high: { type: 'decimal', precision: 40, scale: 8 },
		low: { type: 'decimal', precision: 40, scale: 8 },
		close: { type: 'decimal', precision: 40, scale: 8 },
	},
	indexes: {
		time: { type: 'key' },
	},
	purge: {},
});

module.exports = { getOhlcTableSchema };
