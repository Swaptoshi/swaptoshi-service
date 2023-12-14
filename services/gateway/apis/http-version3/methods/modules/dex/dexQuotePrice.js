const dexQuotePriceSource = require('../../../../../sources/version3/dexQuotePrice');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/price',
	rpcMethod: 'get.dex.quote.price',
	tags: ['DEX'],
	params: {
		baseTokenId: { optional: false, type: 'string' },
		quoteTokenId: { optional: false, type: 'string' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns current base/quote token price';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns current base/quote token price',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns current base/quote token price',
				schema: {
					$ref: '#/definitions/QuotePriceWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexQuotePriceSource,
	envelope,
};
