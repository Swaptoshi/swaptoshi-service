const dexRouteSource = require('../../../../../sources/version3/dexRoute');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/route',
	rpcMethod: 'get.dex.route',
	tags: ['DEX'],
	params: {
		tokenIn: { optional: false, type: 'string' },
		tokenOut: { optional: false, type: 'string' },
		recursion: { optional: true, type: 'number', default: 5 },
		limit: { optional: true, type: 'number', default: 1 },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns swap route with estimated total pool fee';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns swap route with estimated total pool fee',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns swap route with estimated total pool fee',
				schema: {
					$ref: '#/definitions/SwapRouteWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexRouteSource,
	envelope,
};
