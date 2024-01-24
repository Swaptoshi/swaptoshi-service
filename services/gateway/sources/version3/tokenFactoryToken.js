const tokenFactoryToken = require('./mappings/tokenFactoryToken');

module.exports = {
	type: 'moleculer',
	method: 'indexer.factory.token',
	params: {
		tokenIds: '=,string',
		offset: '=,number',
		limit: '=,number',
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
