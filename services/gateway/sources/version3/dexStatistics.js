const dexStatistics = require('./mappings/dexStatistics');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.statistics',
	params: {
		start: '=,number',
		end: '=,number',
	},
	definition: {
		data: dexStatistics,
		meta: {},
	},
};
