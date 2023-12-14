const dexTokenCompact = require('./mappings/dexTokenCompact');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.tokens.compact',
	params: {
		search: '=,string',
		offset: '=,number',
		limit: '=,number',
	},
	definition: {
		data: ['data', dexTokenCompact],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
