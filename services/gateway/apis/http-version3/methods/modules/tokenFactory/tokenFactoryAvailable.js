const tokenFactoryAvailableSource = require('../../../../../sources/version3/tokenFactoryAvailable');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/factory/token/available',
	rpcMethod: 'get.factory.token.available',
	tags: ['TokenFactory'],
	params: {
		tokenName: { optional: false, type: 'string' },
		symbol: { optional: false, type: 'string' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary =
			'Returns whether specified tokenName and/or symbol is already registered on service off-chain data';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description:
				'Returns whether specified tokenName and/or symbol is already registered on service off-chain data',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('TokenFactory', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description:
					'Returns whether specified tokenName and/or symbol is already registered on service off-chain data',
				schema: {
					$ref: '#/definitions/TokenFactoryAvailableWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: tokenFactoryAvailableSource,
	envelope,
};
