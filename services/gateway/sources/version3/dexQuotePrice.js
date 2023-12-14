const dexQuotePrice = require('./mappings/dexQuotePrice');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.quote.price',
	params: {
		baseTokenId: '=,string',
		quoteTokenId: '=,string',
	},
	definition: {
		data: dexQuotePrice,
		meta: {},
	},
};
