const dexPoolTick = require('./mappings/dexPoolTick');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.pools.tick',
	params: {
		poolAddress: '=,string',
	},
	definition: {
		data: ['data', dexPoolTick],
		meta: {},
	},
};
