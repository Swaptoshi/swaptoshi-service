const dexPriceOhlc = require('./mappings/dexPriceOhlc');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.price.ohlc',
	params: {
		base: '=,string',
		quote: '=,string',
		timeframe: '=,string',
		start: '=,number',
		end: '=,number',
		offset: '=,number',
		limit: '=,number',
	},
	definition: {
		data: ['data', dexPriceOhlc],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
