const getOhlcTableSchema = (pair, timeframe) => ({
	tableName: `ohlc_${pair}_${timeframe}`,
	primaryKey: ['time'],
	schema: {
		time: { type: 'integer' },
		open: { type: 'decimal', precision: 8, scale: 4 },
		high: { type: 'decimal', precision: 8, scale: 4 },
		low: { type: 'decimal', precision: 8, scale: 4 },
		close: { type: 'decimal', precision: 8, scale: 4 },
	},
	indexes: {
		time: { type: 'key' },
	},
	purge: {},
});

module.exports = { getOhlcTableSchema };
