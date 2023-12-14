const tokenFactoryStatisticSource = require('../../../../../sources/version3/tokenFactoryStatistic');
const envelope = require('../../../../../sources/version3/mappings/stdEnvelope');
const { transformParams, response, getSwaggerDescription } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/factory/statistic',
	rpcMethod: 'get.factory.statistic',
	tags: ['TokenFactory'],
	params: {},
	get schema() {
		const schema = {};
		schema[this.swaggerApiPath] = { get: {} };
		schema[this.swaggerApiPath].get.tags = this.tags;
		schema[this.swaggerApiPath].get.summary = 'Returns token factory module statistics';
		schema[this.swaggerApiPath].get.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Returns token factory module statistics',
		});
		schema[this.swaggerApiPath].get.parameters = transformParams('TokenFactory', this.params);
		schema[this.swaggerApiPath].get.responses = {
			200: {
				description: 'Returns token factory module statistics',
				schema: {
					$ref: '#/definitions/TokenFactoryStatisticWithEnvelope',
				},
			},
		};
		Object.assign(schema[this.swaggerApiPath].get.responses, response);
		return schema;
	},
	source: tokenFactoryStatisticSource,
	envelope,
};
