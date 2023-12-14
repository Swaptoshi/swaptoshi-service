const dexStatistics = require('./mappings/dexStatistics');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.statistics',
	params: {
		start: '=,string',
		end: '=,string',
	},
	definition: {
		data: dexStatistics,
		meta: {},
	},
};
