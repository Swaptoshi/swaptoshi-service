const dataService = require('../../../shared/dataService');

const createTokenFactory = async params => {
	try {
		const result = {
			data: {},
			meta: {},
		};

		const response = await dataService.createTokenFactory(params);
		if (response.data) result.data = response.data;
		if (response.meta) result.meta = response.meta;

		return result;
	} catch (err) {
		if (err.message.includes('ECONNREFUSED'))
			return {
				data: { error: 'Unable to reach a network node.' },
				status: 'INTERNAL_SERVER_ERROR',
			};

		return {
			data: { error: `Transaction payload was rejected by the network node: ${err.message}.` },
			status: 'BAD_REQUEST',
		};
	}
};

const getTokenFactoriesMeta = async params => {
	const result = {
		data: {},
		meta: {},
	};

	const response = await dataService.getTokenFactoriesMeta(params);
	if (response.data) result.data = response.data;
	if (response.meta) result.meta = response.meta;

	return result;
};

const getTokenFactories = async params => {
	const result = {
		data: {},
		meta: {},
	};

	const response = await dataService.getTokenFactories(params);
	if (response.data) result.data = response.data;
	if (response.meta) result.meta = response.meta;

	return result;
};

const getFactoryStatistics = async params => {
	const result = {
		data: {},
		meta: {},
	};

	const response = await dataService.getFactoryStatistics(params);
	if (response.data) result.data = response.data;
	if (response.meta) result.meta = response.meta;

	return result;
};

const isTokenAvailable = async params => {
	const result = {
		data: {},
		meta: {},
	};

	const response = await dataService.isTokenAvailable(params);
	if (response.data) result.data = response.data;
	if (response.meta) result.meta = response.meta;

	return result;
};

module.exports = {
	createTokenFactory,
	getTokenFactoriesMeta,
	getFactoryStatistics,
	getTokenFactories,
	isTokenAvailable,
};
