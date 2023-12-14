const dexQuoteSwap = require('./mappings/dexQuoteSwap');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.quote.swap',
	params: {
		path: '=,string',
		base: '=,string',
		quote: '=,string',
		amountIn: '=,string',
		amountOut: '=,string',
	},
	definition: {
		data: dexQuoteSwap,
		meta: {},
	},
};
