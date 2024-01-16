const dexPoolTick = require('./mappings/dexPoolTick');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.pools.tick',
	params: {
		poolAddress: '=,string',
		tickLower: '=,number',
		tickUpper: '=,number',
		interval: '=,number',
		inverted: '=,boolean',
	},
	definition: {
		data: ['data', dexPoolTick],
		meta: {},
	},
};
