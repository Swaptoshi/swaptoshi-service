const tokenFactoryCreate = require('../../../../../sources/version3/tokenFactoryCreate');
const { getSwaggerDescription } = require('../../../../../shared/utils');
const { transformParams } = require('../../../../../shared/utils');

module.exports = {
	version: '2.0',
	swaggerApiPath: '/factory/create',
	httpMethod: 'POST',
	rpcMethod: 'post.factory.create',
	tags: ['TokenFactory'],
	params: {
		transaction: { optional: false, type: 'string', altSwaggerKey: 'factoryCreateTransaction' },
		metadata: { optional: false, type: 'string' },
		logo: { optional: false, type: 'string' },
	},
	get schema() {
		const postTransactionSchema = {};
		postTransactionSchema[this.swaggerApiPath] = { post: {} };
		postTransactionSchema[this.swaggerApiPath].post.tags = this.tags;
		postTransactionSchema[this.swaggerApiPath].post.summary =
			'Post tokenFactory:create transaction, and store its offchain metadata';
		postTransactionSchema[this.swaggerApiPath].post.description = getSwaggerDescription({
			rpcMethod: this.rpcMethod,
			description: 'Post tokenFactory:create transaction, and store its offchain metadata',
		});
		postTransactionSchema[this.swaggerApiPath].post.parameters = transformParams(
			'TokenFactory',
			this.params,
		);
		postTransactionSchema[this.swaggerApiPath].post.responses = {
			200: {
				description: 'Broadcast transaction',
				schema: {
					$ref: '#/definitions/TokenFactoryCreateWithEnvelope',
				},
			},
			400: {
				description: 'Bad request',
				schema: {
					$ref: '#/definitions/badRequestEnvelope',
				},
			},
			500: {
				description: 'Internal server error',
				schema: {
					$ref: '#/definitions/serverErrorEnvelope',
				},
			},
		};
		return postTransactionSchema;
	},
	source: tokenFactoryCreate,
};
