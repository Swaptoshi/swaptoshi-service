/* eslint-disable camelcase */
/* eslint-disable no-multi-assign */
/* eslint-disable no-void */

Object.defineProperty(exports, '__esModule', { value: true });
exports.getAmountsForLiquidity =
	exports.getAmount1ForLiquidity =
	exports.getAmount0ForLiquidity =
	exports.getLiquidityForAmounts =
	exports.getLiquidityForAmount1 =
	exports.getLiquidityForAmount0 =
	exports.toUint128 =
		void 0;
const int_1 = require('./int');
const FullMath = require('./core/full_math');
const FixedPoint96 = require('./core/fixed_point_96');

function toUint128(x) {
	return int_1.Uint128.from(x).toString();
}
exports.toUint128 = toUint128;
function getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0) {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (int_1.Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	const intermediate = FullMath.mulDiv(_sqrtRatioAX96, _sqrtRatioBX96, FixedPoint96.Q96);
	const liquidity = toUint128(
		FullMath.mulDiv(
			amount0,
			intermediate,
			int_1.Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
		),
	);
	return liquidity;
}
exports.getLiquidityForAmount0 = getLiquidityForAmount0;
function getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1) {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (int_1.Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	const liquidity = toUint128(
		FullMath.mulDiv(
			amount1,
			FixedPoint96.Q96,
			int_1.Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
		),
	);
	return liquidity;
}
exports.getLiquidityForAmount1 = getLiquidityForAmount1;
function getLiquidityForAmounts(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, amount0, amount1) {
	let liquidity;
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (int_1.Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	if (int_1.Uint160.from(sqrtRatioX96).lte(_sqrtRatioAX96)) {
		liquidity = getLiquidityForAmount0(_sqrtRatioAX96, _sqrtRatioBX96, amount0);
	} else if (int_1.Uint160.from(sqrtRatioX96).lt(_sqrtRatioBX96)) {
		const liquidity0 = getLiquidityForAmount0(sqrtRatioX96, _sqrtRatioBX96, amount0);
		const liquidity1 = getLiquidityForAmount1(_sqrtRatioAX96, sqrtRatioX96, amount1);
		liquidity = int_1.Uint128.from(liquidity0).lt(liquidity1) ? liquidity0 : liquidity1;
	} else {
		liquidity = getLiquidityForAmount1(_sqrtRatioAX96, _sqrtRatioBX96, amount1);
	}
	return liquidity;
}
exports.getLiquidityForAmounts = getLiquidityForAmounts;
function getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (int_1.Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	return int_1.Uint256.from(
		FullMath.mulDiv(
			int_1.Uint256.from(liquidity).shl(FixedPoint96.RESOLUTION).toString(),
			int_1.Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
			_sqrtRatioBX96,
		),
	)
		.div(_sqrtRatioAX96)
		.toString();
}
exports.getAmount0ForLiquidity = getAmount0ForLiquidity;
function getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity) {
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (int_1.Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	return FullMath.mulDiv(
		liquidity,
		int_1.Uint160.from(_sqrtRatioBX96).sub(_sqrtRatioAX96).toString(),
		FixedPoint96.Q96,
	);
}
exports.getAmount1ForLiquidity = getAmount1ForLiquidity;
function getAmountsForLiquidity(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, liquidity) {
	let amount0 = '0';
	let amount1 = '0';
	let _sqrtRatioAX96 = sqrtRatioAX96;
	let _sqrtRatioBX96 = sqrtRatioBX96;
	if (int_1.Uint160.from(sqrtRatioAX96).gt(sqrtRatioBX96)) {
		_sqrtRatioAX96 = sqrtRatioBX96;
		_sqrtRatioBX96 = sqrtRatioAX96;
	}
	if (int_1.Uint160.from(sqrtRatioX96).lte(_sqrtRatioAX96)) {
		amount0 = getAmount0ForLiquidity(_sqrtRatioAX96, _sqrtRatioBX96, liquidity);
	} else if (int_1.Uint160.from(sqrtRatioX96).lt(_sqrtRatioBX96)) {
		amount0 = getAmount0ForLiquidity(sqrtRatioX96, _sqrtRatioBX96, liquidity);
		amount1 = getAmount1ForLiquidity(_sqrtRatioAX96, sqrtRatioX96, liquidity);
	} else {
		amount1 = getAmount1ForLiquidity(_sqrtRatioAX96, _sqrtRatioBX96, liquidity);
	}
	return [amount0, amount1];
}
exports.getAmountsForLiquidity = getAmountsForLiquidity;
// # sourceMappingURL=liquidity_amounts.js.map
