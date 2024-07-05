const { getCandleStickBinance } = require('./binance');
const { getCandleStickBitget } = require('./bitget');
const { getCandleStickBitrue } = require('./bitrue');

const getCandleStick = async params => {
	let ret;
	// TODO: right now the price is mocked to LSKUSD
	const promises = [getCandleStickBinance, getCandleStickBitget, getCandleStickBitrue];

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
