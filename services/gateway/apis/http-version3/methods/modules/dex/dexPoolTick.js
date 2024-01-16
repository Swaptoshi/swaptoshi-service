const dexPoolTickSource = require('../../../../../sources/version3/dexPoolTick');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/dex/pool/tick',
	rpcMethod: 'get.dex.pool.tick',
	tags: ['DEX'],
	params: {
		poolAddress: { optional: false, type: 'string' },
		tickLower: { optional: false, type: 'number' },
		tickUpper: { optional: false, type: 'number' },
		interval: { optional: true, type: 'number', altSwaggerKey: 'dexPoolTickInterval' },
		inverted: { optional: true, type: 'boolean' },
	},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns list of ticks on pools';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns list of ticks on pools',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('DEX', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns list of ticks on pools',
				schema: {
					$ref: '#/definitions/DexPoolTickWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: dexPoolTickSource,
	envelope,
};
