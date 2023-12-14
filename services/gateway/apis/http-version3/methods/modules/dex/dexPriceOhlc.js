const dexPriceOhlcSource = require('../../../../../sources/version3/dexPriceOhlc');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/price/ohlc',
	rpcMethod: 'get.dex.price.ohlc',
	tags: ['DEX'],
	params: {
		base: { optional: false, type: 'string', altSwaggerKey: 'baseSymbol' },
		quote: { optional: false, type: 'string', altSwaggerKey: 'quoteSymbol' },
		timeframe: {
			optional: false,
			type: 'string',
			enum: ['1h', '4h', '1d', '1w', '1M'],
		},
		start: { optional: true, type: 'number' },
		end: { optional: true, type: 'number' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns price in OHLC/Candlestick format';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns price in OHLC/Candlestick format',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns price in OHLC/Candlestick format',
				schema: {
					$ref: '#/definitions/DexPriceOhlcWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexPriceOhlcSource,
	envelope,
};
