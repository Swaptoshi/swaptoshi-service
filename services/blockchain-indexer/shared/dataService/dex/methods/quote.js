const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const config = require('../../../../config');
const { invokeEndpoint } = require('../../invoke');
const { getPrice, getRoute } = require('../priceQuoter');

const dexTokenTableSchema = require('../../../database/schema/registeredDexToken');
const { parseQueryResult } = require('../../../utils/query');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const quoteSwapMethod = async params => {
	const response = {
		data: {
			amount: '',
			sqrtPriceX96AfterList: [],
			initializedTicksCrossedList: [],
		},
		meta: {},
	};

	const tokenTable = await getDEXTokenTable();

	let quote;
	let { path } = params;

	if (params.base && params.quote) {
		const [baseToken] = parseQueryResult(
			await tokenTable.rawQuery(
				`SELECT tokenId FROM registered_dex_token t WHERE tokenId LIKE '%${params.base}%' OR symbol LIKE '%${params.base}%' LIMIT 1`,
			),
		);
		const [quoteToken] = parseQueryResult(
			await tokenTable.rawQuery(
				`SELECT tokenId FROM registered_dex_token t WHERE tokenId LIKE '%${params.quote}%' OR symbol LIKE '%${params.quote}%' LIMIT 1`,
			),
		);
		if (baseToken && quoteToken) {
			[path] = await getRoute(baseToken.tokenId, quoteToken.tokenId, params.recursion || 5);
		}
	}

	if (!path) throw new Error('path not available');

	if (params.amountIn) {
		quote = await invokeEndpoint({
			endpoint: 'dex_quoteExactInput',
			params: {
				path,
				amountIn: params.amountIn,
			},
		});
		response.data.amount = quote.data.amountOut;
	} else if (params.amountOut) {
		quote = await invokeEndpoint({
			endpoint: 'dex_quoteExactOutput',
			params: {
				path,
				amountOut: params.amountOut,
			},
		});
		response.data.amount = quote.data.amountIn;
	}

	response.data.sqrtPriceX96AfterList = quote.data.sqrtPriceX96AfterList;
	response.data.initializedTicksCrossedList = quote.data.initializedTicksCrossedList;
	return response;
};

const quotePriceMethod = async params => {
	const response = {
		data: {},
		meta: {},
	};

	const price = await getPrice(params.baseTokenId, params.quoteTokenId);

	response.data = { price };
	return response;
};

const getRouteMethod = async params => {
	const response = {
		data: {},
		meta: {},
	};

	const route = await getRoute(params.tokenIn, params.tokenOut, params.recursion, params.limit);

	response.data = route;
	return response;
};

module.exports = {
	quoteSwapMethod,
	quotePriceMethod,
	getRouteMethod,
};
