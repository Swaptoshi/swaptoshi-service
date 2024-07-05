/* eslint-disable import/no-unresolved */
const ccxt = require('ccxt');

const bitget = new ccxt.bitget();

const getCandleStickBitget = async params => {
	let { symbol } = params;
	if (symbol.toUpperCase() === 'KLYUSD') symbol = 'LSKUSDT'; // TODO: change to KLYUSDT later
	if (symbol.toUpperCase() === 'KLYUSDT') symbol = 'LSKUSDT'; // TODO: change to KLYUSDT later
	let data = await bitget.fetchOHLCV(symbol, params.interval, Number(params.start) * 1000, 720);
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
	getCandleStickBitget,
};
