/* eslint-disable import/no-extraneous-dependencies */
const Decimal = require('decimal.js').default;
const BigNumber = require('bignumber.js').default;

Decimal.set({ toExpPos: 9999999, toExpNeg: -9999999 });
BigNumber.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const TEN = new BigNumber(10);
const FIVE_SIG_FIGS_POW = new Decimal(10).pow(5);
const Q128 = BigInt(0x100000000000000000000000000000000);

function decodePriceSqrt(
	sqrtRatioX96,
	decimalsToken0 = 8,
	decimalsToken1 = 8,
	inverse = false,
	disableFiveSigPrevision = false,
) {
	const ratioNum = new Decimal(sqrtRatioX96)
		.div(2 ** 96)
		.pow(2)
		.toPrecision(5);
	let ratio = new Decimal(ratioNum);

	if (decimalsToken1 < decimalsToken0) {
		ratio = ratio.mul(TEN.pow(decimalsToken0 - decimalsToken1).toString());
	} else if (decimalsToken0 < decimalsToken1) {
		ratio = ratio.div(TEN.pow(decimalsToken1 - decimalsToken0).toString());
	}

	if (inverse) {
		ratio = ratio.pow(-1);
	}

	if (!disableFiveSigPrevision && ratio.lessThan(FIVE_SIG_FIGS_POW)) {
		return ratio.toPrecision(5);
	}

	return ratio.toString();
}

function encodePriceSqrt(reserve1, reserve0) {
	return new BigNumber(reserve1.toString())
		.div(reserve0.toString())
		.sqrt()
		.multipliedBy(new BigNumber(2).pow(96))
		.integerValue(3)
		.toString();
}

function encodeFeeGrowth(feeGrowth, liquidity) {
	return ((BigInt(feeGrowth) * Q128) / BigInt(liquidity)).toString();
}

function decodeFeeGrowth(feeGrowthX128, liquidity) {
	return ((BigInt(feeGrowthX128) * BigInt(liquidity)) / Q128).toString();
}

function inversePriceSqrt(sqrtRatioX96, decimalsToken0 = 8, decimalsToken1 = 8) {
	const price = decodePriceSqrt(sqrtRatioX96, decimalsToken0, decimalsToken1, true, true);
	return encodePriceSqrt(price, 1);
}

module.exports = {
	inversePriceSqrt,
	decodeFeeGrowth,
	decodePriceSqrt,
	encodeFeeGrowth,
	encodePriceSqrt,
};
