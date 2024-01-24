const tokenFactoryMeta = require('./mappings/tokenFactoryMeta');

module.exports = {
	type: 'moleculer',
	method: 'indexer.factory.token.meta',
	params: {
		tokenIds: '=,string',
		registry: '=,boolean',
		offset: '=,number',
		limit: '=,number',
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
