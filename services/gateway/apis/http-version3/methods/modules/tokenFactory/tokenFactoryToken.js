const tokenFactoryTokenSource = require('../../../../../sources/version3/tokenFactoryToken');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/factory/token',
	rpcMethod: 'get.factory.token',
	tags: ['TokenFactory'],
	params: {
		tokenIds: { optional: false, type: 'string' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary =
			'Returns list of token which created by Token Factory module';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns list of token which created by Token Factory module',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('TokenFactory', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns list of token which created by Token Factory module',
				schema: {
					$ref: '#/definitions/TokenFactoryTokenWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: tokenFactoryTokenSource,
	envelope,
};
