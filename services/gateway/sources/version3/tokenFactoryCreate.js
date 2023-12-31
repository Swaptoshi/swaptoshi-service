const tokenFactoryCreate = require('./mappings/tokenFactoryCreate');

module.exports = {
	type: 'moleculer',
	method: 'indexer.factory.create',
	params: {
		transaction: '=,string',
		metadata: '=,string',
		logo: '=,string',
	},
	definition: {
		data: tokenFactoryCreate,
		meta: {},
	},
};
