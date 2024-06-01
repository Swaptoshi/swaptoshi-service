const { getCandleStickBinance } = require('./binance');
const { getCandleStickBitget } = require('./bitget');
const { getCandleStickBitrue } = require('./bitrue');
const { getCandleStickMockup } = require('./mockup');

const getCandleStick = async params => {
	let ret;
	const promises = [
		getCandleStickMockup, // since KLYUSD is not available on the market yet, the price is mocked
		getCandleStickBinance,
		getCandleStickBitget,
		getCandleStickBitrue,
	];

	// eslint-disable-next-line no-restricted-syntax
	for (const method of promises) {
		try {
			ret = await method(params);
			break;
		} catch (err) {
			/* empty */
		}
	}

	if (!ret) throw new Error('All market source not available at the moment');

	return ret;
};

module.exports = {
	getCandleStick,
};
