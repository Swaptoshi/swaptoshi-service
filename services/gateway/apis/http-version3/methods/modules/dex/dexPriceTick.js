const dexPriceTickSource = require('../../../../../sources/version3/dexPriceTick');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/price/tick',
	rpcMethod: 'get.dex.price.tick',
	tags: ['DEX'],
	params: {
		base: { optional: false, type: 'string', altSwaggerKey: 'baseSymbol' },
		quote: { optional: false, type: 'string', altSwaggerKey: 'quoteSymbol' },
		start: { optional: true, type: 'number' },
		end: { optional: true, type: 'number' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns price tick';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns price tick',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns price tick',
				schema: {
					$ref: '#/definitions/DexPriceTickWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexPriceTickSource,
	envelope,
};
