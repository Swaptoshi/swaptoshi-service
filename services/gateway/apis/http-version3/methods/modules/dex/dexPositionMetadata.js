const dexPositionMetadataSource = require('../../../../../sources/version3/dexPositionMetadata');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/position/metadata',
	rpcMethod: 'get.dex.position.metadata',
	tags: ['DEX'],
	params: {
		tokenId: { optional: false, type: 'string' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns LP NFT metadata';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns LP NFT metadata',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns LP NFT metadata',
				schema: {
					$ref: '#/definitions/DexPositionMetadataWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexPositionMetadataSource,
	envelope,
};
