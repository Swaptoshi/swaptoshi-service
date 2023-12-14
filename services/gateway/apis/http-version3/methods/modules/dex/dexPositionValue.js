const dexPositionValueSource = require('../../../../../sources/version3/dexPositionValue');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/position/value',
	rpcMethod: 'get.dex.position.value',
	tags: ['DEX'],
	params: {
		tokenId: { optional: false, type: 'string' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns liquidity position value information';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns liquidity position value information',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns liquidity position value information',
				schema: {
					$ref: '#/definitions/DexPositionValueWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexPositionValueSource,
	envelope,
};
