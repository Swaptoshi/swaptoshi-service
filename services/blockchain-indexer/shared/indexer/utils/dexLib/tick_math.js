/* eslint-disable no-nested-ternary */
/* eslint-disable no-void */
/* eslint-disable camelcase */
/* eslint-disable no-multi-assign */

Object.defineProperty(exports, '__esModule', { value: true });
exports.getTickAtSqrtRatio =
	exports.getSqrtRatioAtTick =
	exports.MAX_SQRT_RATIO =
	exports.MIN_SQRT_RATIO =
	exports.MAX_TICK =
	exports.MIN_TICK =
		void 0;
const int_1 = require('./int');

exports.MIN_TICK = '-887272';
exports.MAX_TICK = '887272';
exports.MIN_SQRT_RATIO = '4295128739';
exports.MAX_SQRT_RATIO = '1461446703485210103287273052203988822378723970342';
function getSqrtRatioAtTick(tick) {
	let sqrtPriceX96 = int_1.Uint160.from(0);
	const absTick = int_1.Uint256.from(int_1.Int24.from(tick).abs());
	if (absTick.gt(int_1.Uint256.from(exports.MAX_TICK))) throw new Error('T');
	let ratio = !absTick.and(0x1).eq(0)
		? int_1.Uint256.from('0xfffcb933bd6fad37aa2d162d1a594001')
		: int_1.Uint256.from('0x100000000000000000000000000000000');
	if (!absTick.and(0x2).eq(0)) ratio = ratio.mul('0xfff97272373d413259a46990580e213a').shr(128);
	if (!absTick.and(0x4).eq(0)) ratio = ratio.mul('0xfff2e50f5f656932ef12357cf3c7fdcc').shr(128);
	if (!absTick.and(0x8).eq(0)) ratio = ratio.mul('0xffe5caca7e10e4e61c3624eaa0941cd0').shr(128);
	if (!absTick.and(0x10).eq(0)) ratio = ratio.mul('0xffcb9843d60f6159c9db58835c926644').shr(128);
	if (!absTick.and(0x20).eq(0)) ratio = ratio.mul('0xff973b41fa98c081472e6896dfb254c0').shr(128);
	if (!absTick.and(0x40).eq(0)) ratio = ratio.mul('0xff2ea16466c96a3843ec78b326b52861').shr(128);
	if (!absTick.and(0x80).eq(0)) ratio = ratio.mul('0xfe5dee046a99a2a811c461f1969c3053').shr(128);
	if (!absTick.and(0x100).eq(0)) ratio = ratio.mul('0xfcbe86c7900a88aedcffc83b479aa3a4').shr(128);
	if (!absTick.and(0x200).eq(0)) ratio = ratio.mul('0xf987a7253ac413176f2b074cf7815e54').shr(128);
	if (!absTick.and(0x400).eq(0)) ratio = ratio.mul('0xf3392b0822b70005940c7a398e4b70f3').shr(128);
	if (!absTick.and(0x800).eq(0)) ratio = ratio.mul('0xe7159475a2c29b7443b29c7fa6e889d9').shr(128);
	if (!absTick.and(0x1000).eq(0)) ratio = ratio.mul('0xd097f3bdfd2022b8845ad8f792aa5825').shr(128);
	if (!absTick.and(0x2000).eq(0)) ratio = ratio.mul('0xa9f746462d870fdf8a65dc1f90e061e5').shr(128);
	if (!absTick.and(0x4000).eq(0)) ratio = ratio.mul('0x70d869a156d2a1b890bb3df62baf32f7').shr(128);
	if (!absTick.and(0x8000).eq(0)) ratio = ratio.mul('0x31be135f97d08fd981231505542fcfa6').shr(128);
	if (!absTick.and(0x10000).eq(0)) ratio = ratio.mul('0x9aa508b5b7a84e1c677de54f3e99bc9').shr(128);
	if (!absTick.and(0x20000).eq(0)) ratio = ratio.mul('0x5d6af8dedb81196699c329225ee604').shr(128);
	if (!absTick.and(0x40000).eq(0)) ratio = ratio.mul('0x2216e584f5fa1ea926041bedfe98').shr(128);
	if (!absTick.and(0x80000).eq(0)) ratio = ratio.mul('0x48a170391f7dc42444e8fa2').shr(128);
	if (int_1.Int24.from(tick).gt(0)) ratio = int_1.Uint256.from(int_1.Uint256.MAX).div(ratio);
	sqrtPriceX96 = int_1.Uint160.from(ratio.shr(32)).add(
		ratio.mod(int_1.Uint256.from(1).shl(32)).eq(0) ? 0 : 1,
	);
	return sqrtPriceX96.toString();
}
exports.getSqrtRatioAtTick = getSqrtRatioAtTick;
function getTickAtSqrtRatio(sqrtPriceX96) {
	if (
		!(
			int_1.Uint160.from(sqrtPriceX96).gte(exports.MIN_SQRT_RATIO) &&
			int_1.Uint160.from(sqrtPriceX96).lt(exports.MAX_SQRT_RATIO)
		)
	) {
		throw new Error('R');
	}
	const ratio = int_1.Uint256.from(sqrtPriceX96).shl(32);
	let r = int_1.Uint256.from(ratio);
	let msb = int_1.Uint256.from(0);
	let f = int_1.Uint256.from(r.gt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF') ? 1 : 0).shl(7);
	msb = msb.or(f);
	r = r.shr(f);
	f = int_1.Uint256.from(r.gt('0xFFFFFFFFFFFFFFFF') ? 1 : 0).shl(6);
	msb = msb.or(f);
	r = r.shr(f);
	f = int_1.Uint256.from(r.gt('0xFFFFFFFF') ? 1 : 0).shl(5);
	msb = msb.or(f);
	r = r.shr(f);
	f = int_1.Uint256.from(r.gt('0xFFFF') ? 1 : 0).shl(4);
	msb = msb.or(f);
	r = r.shr(f);
	f = int_1.Uint256.from(r.gt('0xFF') ? 1 : 0).shl(3);
	msb = msb.or(f);
	r = r.shr(f);
	f = int_1.Uint256.from(r.gt('0xF') ? 1 : 0).shl(2);
	msb = msb.or(f);
	r = r.shr(f);
	f = int_1.Uint256.from(r.gt('0x3') ? 1 : 0).shl(1);
	msb = msb.or(f);
	r = r.shr(f);
	f = int_1.Uint256.from(r.gt('0x1') ? 1 : 0);
	msb = msb.or(f);
	if (msb.gte(128)) r = ratio.shr(msb.sub(127));
	else r = ratio.shl(int_1.Uint256.from(127).sub(msb));
	let log_2 = int_1.Int256.from(msb).sub(128).shl(64);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(63));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(62));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(61));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(60));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(59));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(58));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(57));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(56));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(55));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(54));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(53));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(52));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(51));
	r = r.shr(f);
	r = r.mul(r).shr(127);
	f = r.shr(128);
	log_2 = log_2.or(f.shl(50));
	const log_sqrt10001 = log_2.mul('255738958999603826347141');
	const tickLow = int_1.Int24.from(
		log_sqrt10001.sub('3402992956809132418596140100660247210').shr(128),
	);
	const tickHi = int_1.Int24.from(
		log_sqrt10001.add('291339464771989622907027621153398088495').shr(128),
	);
	const tick = tickLow.eq(tickHi)
		? tickLow
		: int_1.Int256.from(getSqrtRatioAtTick(tickHi.toString())).lte(sqrtPriceX96)
		? tickHi
		: tickLow;
	return tick.toString();
}
exports.getTickAtSqrtRatio = getTickAtSqrtRatio;
// # sourceMappingURL=tick_math.js.map
