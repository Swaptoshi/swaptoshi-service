const dataService = require('../../../shared/dataService');

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
	getTokenFactoriesMeta,
	getFactoryStatistics,
	getTokenFactories,
	isTokenAvailable,
};
