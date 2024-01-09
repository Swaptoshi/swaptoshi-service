const tokenFactoryAvailable = require('./mappings/tokenFactoryAvailable');

module.exports = {
	type: 'moleculer',
	method: 'indexer.factory.available',
	params: {
		tokenName: '=,string',
		symbol: '=,string',
	},
	definition: {
		data: tokenFactoryAvailable,
		meta: {},
	},
};
