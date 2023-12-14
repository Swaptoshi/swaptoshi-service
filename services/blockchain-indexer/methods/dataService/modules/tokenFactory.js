const {
	createTokenFactory,
	getTokenFactoriesMeta,
	getFactoryStatistics,
	getTokenFactories,
} = require('../controllers/tokenFactory');

module.exports = [
	{
		name: 'factory.create',
		controller: createTokenFactory,
		params: {
			transaction: { optional: false, type: 'string' },
			metadata: { optional: false, type: 'string' },
			logo: { optional: false, type: 'string' },
		},
	},
	{
		name: 'factory.token.meta',
		controller: getTokenFactoriesMeta,
		params: {
			tokenIds: { optional: false, type: 'string' },
			registry: { optional: true, type: 'boolean' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'factory.token',
		controller: getTokenFactories,
		params: {
			tokenIds: { optional: false, type: 'string' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'factory.statistics',
		controller: getFactoryStatistics,
		params: {},
	},
];
