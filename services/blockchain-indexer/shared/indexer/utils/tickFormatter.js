function getPriceAtTick(tick, token0Decimals = 8, token1Decimals = 8, inverted = false) {
	const price = 1.0001 ** tick;
	let adjustedPrice = price * 10 ** (token1Decimals - token0Decimals);

	if (inverted) {
		adjustedPrice = 1 / adjustedPrice;
	}

	return Number(adjustedPrice.toPrecision(inverted ? token1Decimals : token0Decimals));
}

function getTickAtPrice(price, token0Decimals = 8, token1Decimals = 8, inverted = false) {
	if (inverted) {
		price = Number((1 / price).toPrecision(inverted ? token1Decimals : token0Decimals));
	}

	const adjustedPrice = price / 10 ** (token1Decimals - token0Decimals);
	const tick = Math.log(adjustedPrice) / Math.log(1.0001);

	return Math.round(tick);
}

module.exports = { getPriceAtTick, getTickAtPrice };
