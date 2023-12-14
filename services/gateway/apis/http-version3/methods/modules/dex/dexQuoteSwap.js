const dexQuoteSwapSource = require('../../../../../sources/version3/dexQuoteSwap');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/quote',
	rpcMethod: 'get.dex.quote',
	tags: ['DEX'],
	params: {
		path: { optional: true, type: 'string' },
		base: { optional: true, type: 'string' },
		quote: { optional: true, type: 'string' },
		amountIn: { optional: true, type: 'string' },
		amountOut: { optional: true, type: 'string' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns DEX swap quote by exactIn or exactOut';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns DEX swap quote by exactIn or exactOut',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns DEX swap quote by exactIn or exactOut',
				schema: {
					$ref: '#/definitions/QuoteSwapWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexQuoteSwapSource,
	envelope,
};
