const dexRoute = require('./mappings/dexRoute');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.route',
	params: {
		tokenIn: '=,string',
		tokenOut: '=,string',
		recursion: '=,number',
		limit: '=,number',
	},
	definition: {
		data: ['data', dexRoute],
		meta: {},
	},
};
