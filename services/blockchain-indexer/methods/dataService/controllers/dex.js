const dataService = require('../../../shared/dataService');

const quoteSwap = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.quoteSwapMethod(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const quotePrice = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.quotePriceMethod(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getRoute = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getRouteMethod(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getDEXTokens = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getDEXTokens({ ...params, compact: false });
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getDEXTokensCompact = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getDEXTokens({ ...params, compact: true });
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getPools = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getPools(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getPoolTicks = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getPoolTicks(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getPositions = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getPositions(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getPositionValue = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getPositionValue(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getPositionMetadata = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getPositionMetadata(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getTickPrice = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getTickPrice(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getOhlcPrice = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getOhlcPrice(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const getDEXStatisticSummary = async params => {
	const res = {
		data: {},
		meta: {},
	};

	const response = await dataService.getDEXStatisticSummary(params);
	if (response.data) res.data = response.data;
	if (response.meta) res.meta = response.meta;

	return res;
};

const generateSparklineBuffer = async params =>
	dataService.generateSparklineBuffer(params.base, params.quote, params.interval, params.limit);

module.exports = {
	quoteSwap,
	quotePrice,
	getRoute,
	getDEXTokens,
	getDEXTokensCompact,
	getPoolTicks,
	getPools,
	getPositions,
	getPositionValue,
	getPositionMetadata,
	getTickPrice,
	getOhlcPrice,
	getDEXStatisticSummary,
	generateSparklineBuffer,
};
