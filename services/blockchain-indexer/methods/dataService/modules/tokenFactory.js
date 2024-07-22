const {
	getTokenFactoriesMeta,
	getFactoryStatistics,
	getTokenFactories,
	isTokenAvailable,
} = require('../controllers/tokenFactory');

module.exports = [
	{
		name: 'factory.token.meta',
		controller: getTokenFactoriesMeta,
		params: {
			tokenIds: { optional: true, type: 'string' },
			registry: { optional: true, type: 'boolean' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'factory.token',
		controller: getTokenFactories,
		params: {
			tokenIds: { optional: true, type: 'string' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'factory.statistics',
		controller: getFactoryStatistics,
		params: {},
	},
	{
		name: 'factory.available',
		controller: isTokenAvailable,
		params: {
			tokenName: { optional: false, type: 'string' },
			symbol: { optional: false, type: 'string' },
		},
	},
];
