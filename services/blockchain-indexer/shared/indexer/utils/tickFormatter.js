/* eslint-disable import/no-extraneous-dependencies */
const Decimal = require('decimal.js').default;

Decimal.set({ toExpPos: 9999999, toExpNeg: -9999999 });

function getPriceAtTick(tick, token0Decimals = 8, token1Decimals = 8, inverted = false) {
	let price = new Decimal(1.0001)
		.pow(tick)
		.mul(new Decimal(10).pow(Number(token1Decimals) - Number(token0Decimals)));

	if (inverted) {
		price = price.pow(-1);
	}

	return price
		.toDecimalPlaces(inverted ? Number(token1Decimals) : Number(token0Decimals))
		.toString();
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
