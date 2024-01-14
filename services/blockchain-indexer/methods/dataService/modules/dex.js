const {
	quotePrice,
	getDEXTokens,
	quoteSwap,
	getRoute,
	getPools,
	getPoolTicks,
	getPositions,
	getPositionValue,
	getPositionMetadata,
	getTickPrice,
	getOhlcPrice,
	getDEXStatisticSummary,
	generateSparklineBuffer,
	getDEXTokensCompact,
} = require('../controllers/dex');

module.exports = [
	{
		name: 'dex.quote.swap',
		controller: quoteSwap,
		params: {
			path: { optional: true, type: 'string' },
			base: { optional: true, type: 'string' },
			quote: { optional: true, type: 'string' },
			amountIn: { optional: true, type: 'string' },
			amountOut: { optional: true, type: 'string' },
		},
	},
	{
		name: 'dex.quote.price',
		controller: quotePrice,
		params: {
			baseTokenId: { optional: false, type: 'string' },
			quoteTokenId: { optional: false, type: 'string' },
		},
	},
	{
		name: 'dex.route',
		controller: getRoute,
		params: {
			tokenIn: { optional: false, type: 'string' },
			tokenOut: { optional: false, type: 'string' },
			recursion: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'dex.tokens',
		controller: getDEXTokens,
		params: {
			search: { optional: true, type: 'string' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
			changeWindow: { optional: true, type: 'string' },
			start: { optional: true, type: 'number' },
			end: { optional: true, type: 'number' },
			sortBy: { optional: true, type: 'string' },
			sortOrder: { optional: true, type: 'string' },
		},
	},
	{
		name: 'dex.tokens.compact',
		controller: getDEXTokensCompact,
		params: {
			search: { optional: true, type: 'string' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'dex.pools',
		controller: getPools,
		params: {
			search: { optional: true, type: 'string' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
			start: { optional: true, type: 'number' },
			end: { optional: true, type: 'number' },
			sortBy: { optional: true, type: 'string' },
			sortOrder: { optional: true, type: 'string' },
		},
	},
	{
		name: 'dex.pools.tick',
		controller: getPoolTicks,
		params: {
			poolAddress: { optional: false, type: 'string' },
			tickLower: { optional: false, type: 'number' },
			tickUpper: { optional: false, type: 'number' },
			interval: { optional: true, type: 'number' },
			sortBy: { optional: true, type: 'string' },
		},
	},
	{
		name: 'dex.positions',
		controller: getPositions,
		params: {
			search: { optional: true, type: 'string' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
			sortBy: { optional: true, type: 'string' },
			sortOrder: { optional: true, type: 'string' },
		},
	},
	{
		name: 'dex.positions.value',
		controller: getPositionValue,
		params: {
			tokenId: { optional: false, type: 'string' },
		},
	},
	{
		name: 'dex.positions.metadata',
		controller: getPositionMetadata,
		params: {
			tokenId: { optional: false, type: 'string' },
		},
	},
	{
		name: 'dex.price.tick',
		controller: getTickPrice,
		params: {
			base: { optional: false, type: 'string' },
			quote: { optional: false, type: 'string' },
			start: { optional: true, type: 'number' },
			end: { optional: true, type: 'number' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'dex.price.ohlc',
		controller: getOhlcPrice,
		params: {
			base: { optional: false, type: 'string' },
			quote: { optional: false, type: 'string' },
			timeframe: { optional: false, type: 'string' },
			start: { optional: true, type: 'number' },
			end: { optional: true, type: 'number' },
			offset: { optional: true, type: 'number' },
			limit: { optional: true, type: 'number' },
		},
	},
	{
		name: 'dex.statistics',
		controller: getDEXStatisticSummary,
		params: {
			start: { optional: true, type: 'number' },
			end: { optional: true, type: 'number' },
		},
	},
	{
		name: 'dex.sparkline.buffer',
		controller: generateSparklineBuffer,
		params: {
			base: { optional: false, type: 'string' },
			quote: { optional: false, type: 'string' },
			interval: { optional: false, type: 'number' },
			limit: { optional: false, type: 'number' },
			start: { optional: true, type: 'number' },
			end: { optional: true, type: 'number' },
		},
	},
];
