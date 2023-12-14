const dexPoolSource = require('../../../../../sources/version3/dexPool');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/pool',
	rpcMethod: 'get.dex.pool',
	tags: ['DEX'],
	params: {
		search: { optional: true, type: 'string', altSwaggerKey: 'dexPoolSearch' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
		start: { optional: true, type: 'number' },
		end: { optional: true, type: 'number' },
		sortBy: {
			optional: true,
			type: 'string',
			enum: [
				'poolAddress',
				'token0',
				'token1',
				'fee',
				'liquidity',
				'price',
				'feeGrowth0',
				'feeGrowth0USD',
				'feeGrowth1',
				'feeGrowth1USD',
				'token0Price',
				'token0PriceUSD',
				'token1Price',
				'token1PriceUSD',
				'tick',
				'volumeToken0',
				'volumeToken0USD',
				'volumeToken1',
				'volumeToken1USD',
				'swapCount',
				'totalTvlToken0',
				'totalTvlToken0USD',
				'totalTvlToken1',
				'totalTvlToken1USD',
				'positionCount',
			],
			default: 'poolAddress',
		},
		sortOrder: { optional: true, type: 'string', enum: ['asc', 'desc'], default: 'desc' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns list of pools';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns list of pools',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns list of pools',
				schema: {
					$ref: '#/definitions/DexPoolsWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexPoolSource,
	envelope,
};
