const tokenFactoryMeta = require('./mappings/tokenFactoryMeta');

module.exports = {
	type: 'moleculer',
	method: 'indexer.factory.token.meta',
	params: {
		tokenIds: '=,string',
		registry: '=,boolean',
		offset: '=,string',
		limit: '=,string',
	},
	definition: {
		data: ['data', tokenFactoryMeta],
		meta: {
			count: '=,number',
			offset: '=,number',
			total: '=,number',
		},
	},
};
