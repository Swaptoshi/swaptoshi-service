const tokenFactoryMetaSource = require('../../../../../sources/version3/tokenFactoryMeta');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/factory/token/meta',
	rpcMethod: 'get.factory.token.meta',
	tags: ['TokenFactory'],
	params: {
		tokenIds: { optional: false, type: 'string' },
		registry: { optional: true, type: 'boolean' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary =
			'Returns list of token metadata which may include registered token on official registry, and/or created by token factory';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description:
				'Returns list of token metadata which may include registered token on official registry, and/or created by token factory',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('TokenFactory', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description:
					'Returns list of token metadata which may include registered token on official registry, and/or created by token factory',
				schema: {
					$ref: '#/definitions/TokenFactoryMetaWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: tokenFactoryMetaSource,
	envelope,
};
