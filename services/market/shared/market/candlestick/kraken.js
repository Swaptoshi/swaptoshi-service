/* eslint-disable import/no-unresolved */
const ccxt = require('ccxt');

const kraken = new ccxt.kraken();

const getCandleStickKraken = async params => {
	let { symbol } = params;
	if (symbol.toUpperCase() === 'KLYUSD') symbol = 'LSKUSD'; // TODO: change to KLYUSD later
	if (symbol.toUpperCase() === 'KLYUSDT') symbol = 'LSKUSD'; // TODO: change to KLYUSD later
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
			// eslint-disable-next-line no-promise-executor-return
			await new Promise(r => setInterval(r, 2000));
			return getCandleStickKraken(params);
		}
		throw err;
	}
};

module.exports = {
	getCandleStickKraken,
};
