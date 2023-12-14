const dexTokenCompactSource = require('../../../../../sources/version3/dexTokenCompact');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/token/compact',
	rpcMethod: 'get.dex.token.compact',
	tags: ['DEX'],
	params: {
		search: { optional: true, type: 'string', altSwaggerKey: 'dexTokenSearch' },
		offset: { optional: true, type: 'number' },
		limit: { optional: true, type: 'number' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns list of compact tradable tokens on DEX';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns list of compact tradable tokens on DEX',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns list of compact tradable tokens on DEX',
				schema: {
					$ref: '#/definitions/DEXTokenCompactsWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexTokenCompactSource,
	envelope,
};
