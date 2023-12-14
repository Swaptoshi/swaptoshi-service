const dexToken = require('./mappings/dexToken');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.tokens',
	params: {
		search: '=,string',
		offset: '=,number',
		limit: '=,number',
		changeWindow: '=,string',
		start: '=,number',
		end: '=,number',
		sortBy: '=,string',
		sortOrder: '=,string',
	},
	definition: {
		data: ['data', dexToken],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
