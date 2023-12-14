const tokenFactoryToken = require('./mappings/tokenFactoryToken');

module.exports = {
	type: 'moleculer',
	method: 'indexer.factory.token',
	params: {
		tokenIds: '=,string',
		offset: '=,string',
		limit: '=,string',
	},
	definition: {
		data: ['data', tokenFactoryToken],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
