const dexPosition = require('./mappings/dexPosition');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.positions',
	params: {
		search: '=,string',
		offset: '=,number',
		limit: '=,number',
		sortBy: '=,string',
		sortOrder: '=,string',
	},
	definition: {
		data: ['data', dexPosition],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
