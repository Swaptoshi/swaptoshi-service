const dexPool = require('./mappings/dexPool');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.pools',
	params: {
		search: '=,string',
		offset: '=,number',
		limit: '=,number',
		start: '=,number',
		end: '=,number',
		sortBy: '=,string',
		sortOrder: '=,string',
	},
	definition: {
		data: ['data', dexPool],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
