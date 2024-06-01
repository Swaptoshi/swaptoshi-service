/* eslint-disable import/no-unresolved */
const ccxt = require('ccxt');

const binance = new ccxt.binance();

const getCandleStickBinance = async params => {
	let { symbol } = params;
	if (symbol === 'KLYUSD') symbol = 'KLYUSDT';
	let data = await binance.fetchOHLCV(symbol, params.interval, Number(params.start) * 1000, 720);
	data = data.map(t => ({
		start: Math.floor(t[0] / 1000),
		open: t[1],
		high: t[2],
		low: t[3],
		close: t[4],
		volume: t[5],
	}));
	return data;
};

module.exports = {
	getCandleStickBinance,
};
