const tokenFactoryStatistic = require('./mappings/tokenFactoryStatistic');

module.exports = {
	type: 'moleculer',
	method: 'indexer.factory.statistics',
	params: {},
	definition: {
		data: tokenFactoryStatistic,
		meta: {},
	},
};
