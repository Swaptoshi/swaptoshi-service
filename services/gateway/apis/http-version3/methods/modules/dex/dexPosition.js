const dexPositionSource = require('../../../../../sources/version3/dexPosition');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/position',
	rpcMethod: 'get.dex.position',
	tags: ['DEX'],
	params: {
		search: { optional: true, type: 'string', altSwaggerKey: 'dexPositionSearch' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
		sortBy: {
			optional: true,
			type: 'string',
			enum: [
				'poolAddress',
				'token0',
				'token1',
				'tokenId',
				'owner',
				'collectionId',
				'tickLower',
				'priceLower',
				'tickUpper',
				'priceUpper',
				'liquidity',
			],
			default: 'tokenId',
		},
		sortOrder: { optional: true, type: 'string' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns list of liquidity position';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns list of liquidity position',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns list of liquidity position',
				schema: {
					$ref: '#/definitions/DexPositionWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexPositionSource,
	envelope,
};
