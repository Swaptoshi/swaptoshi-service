/* eslint-disable import/no-unresolved */
const ccxt = require('ccxt');

const kraken = new ccxt.kraken();

const getCandleStickKraken = async params => {
	let { symbol } = params;
	if (symbol === 'LSKUSDT') symbol = 'LSKUSD';
	let data;

	try {
		data = await kraken.fetchOHLCV(symbol, params.interval, Number(params.start) * 1000, 720);
		data = data.map(t => ({
			start: Math.floor(t[0] / 1000),
			open: t[1],
			high: t[2],
			low: t[3],
			close: t[4],
			volume: t[5],
		}));
		return data;
	} catch (err) {
		if (err.message === 'kraken {"error":["EGeneral:Too many requests"]}') {
			await new Promise(r => setInterval(r, 2000));
			return getCandleStickKraken(params);
		}
		throw err;
	}
};

module.exports = {
	getCandleStickKraken,
};
