const dexTokenSource = require('../../../../../sources/version3/dexToken');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/token',
	rpcMethod: 'get.dex.token',
	tags: ['DEX'],
	params: {
		search: { optional: true, type: 'string', altSwaggerKey: 'dexTokenSearch' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
		changeWindow: {
			optional: true,
			type: 'string',
			enum: ['1h', '24h', '7d', '30d', '1y'],
			default: '24h',
		},
		start: { optional: true, type: 'number' },
		end: { optional: true, type: 'number' },
		sortBy: {
			optional: true,
			type: 'string',
			enum: [
				'tokenId',
				'symbol',
				'tokenName',
				'decimal',
				'volume',
				'volumeUSD',
				'feeGrowth',
				'feeGrowthUSD',
				'txCount',
				'poolCount',
				'totalTvl',
				'totalTvlUSD',
				'price',
				'priceUSD',
				'priceChange',
				'priceChangeUSD',
			],
			default: 'volumeUSD',
		},
		sortOrder: { optional: true, type: 'string', enum: ['asc', 'desc'], default: 'desc' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns list of tradable tokens on DEX';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns list of tradable tokens on DEX',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns list of tradable tokens on DEX',
				schema: {
					$ref: '#/definitions/DexTokensWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexTokenSource,
	envelope,
};
