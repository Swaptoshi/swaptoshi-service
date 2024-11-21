/* eslint-disable camelcase */
/* eslint-disable no-multi-assign */
/* eslint-disable no-void */
Object.defineProperty(exports, '__esModule', { value: true });
exports.mulDivRoundingUp = exports.mulDiv = void 0;
const int_1 = require('../int');

function mulDiv(a, b, denominator) {
	if (denominator === '0') throw new Error('Denominator must be greater than zero');
	if (int_1.Uint.from(a).mul(b).div(denominator).gt(int_1.Uint256.MAX)) throw new Error('overflow');
	if (a === '0' || b === '0') return '0';
	return int_1.Uint.from(a).mul(b).div(denominator).toString();
}
exports.mulDiv = mulDiv;
function mulDivRoundingUp(a, b, denominator) {
	let result = int_1.Uint256.from(mulDiv(a, b, denominator));
	if (int_1.Uint.from(a).mul(b).mod(denominator).gt(0)) {
		if (result.gte(int_1.Uint256.MAX)) {
			throw new Error('Result exceeds the maximum value for uint256');
		}
		result = result.add(1);
	}
	return result.toString();
}
exports.mulDivRoundingUp = mulDivRoundingUp;
// # sourceMappingURL=full_math.js.map
