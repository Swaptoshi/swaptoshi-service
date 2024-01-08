const { getCandleStickBinance } = require('./binance');

const getCandleStick = async params => {
	const promises = [getCandleStickBinance(params)];
	return Promise.any(promises);
};

module.exports = {
	getCandleStick,
};
