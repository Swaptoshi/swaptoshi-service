const { addPriceIndex, deletePriceIndex, addGenesisPriceIndex } = require('./priceIndexer');
const {
	getWeightedPrice,
	getPrice,
	getRoute,
	transformTickToOhlc,
	getLastPrice,
} = require('./priceQuoter');
const {
	getKLYUSDCandles,
	getKLYUSDPrice,
	getKLYUSDPriceAtTimestamp,
	getKLYUSDLastPrice,
} = require('./klyPrices');
const { intervalToSecond, normalizeBlockTime } = require('./timestamp');
const {
	getDEXTokens,
	getPools,
	getPoolTicks,
	getPositions,
	getPositionValue,
	getPositionMetadata,
	getTickPrice,
	getOhlcPrice,
	quoteSwapMethod,
	quotePriceMethod,
	getRouteMethod,
	getDEXStatisticSummary,
} = require('./methods');
const { generateSparklineBuffer } = require('./priceSparkLine');

module.exports = {
	addPriceIndex,
	deletePriceIndex,
	addGenesisPriceIndex,
	getWeightedPrice,
	getPrice,
	getRoute,
	transformTickToOhlc,
	getLastPrice,
	getKLYUSDCandles,
	getKLYUSDPrice,
	getKLYUSDPriceAtTimestamp,
	getKLYUSDLastPrice,
	intervalToSecond,
	normalizeBlockTime,
	getDEXTokens,
	getPools,
	getPoolTicks,
	getPositions,
	getPositionValue,
	getPositionMetadata,
	getTickPrice,
	getOhlcPrice,
	quoteSwapMethod,
	quotePriceMethod,
	getRouteMethod,
	getDEXStatisticSummary,
	generateSparklineBuffer,
};
