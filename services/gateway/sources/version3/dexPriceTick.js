const dexPriceTick = require('./mappings/dexPriceTick');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.price.tick',
	params: {
		base: '=,string',
		quote: '=,string',
		start: '=,number',
		end: '=,number',
		offset: '=,number',
		limit: '=,number',
	},
	definition: {
		data: ['data', dexPriceTick],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
