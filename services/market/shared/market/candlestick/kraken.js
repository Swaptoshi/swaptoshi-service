const {
	HTTP,
	Exceptions: { ServiceUnavailableException },
} = require('lisk-service-framework');

const requestLib = HTTP.request;

const config = require('../../../config');
const { intervalToSecond } = require('../../utils/timestamp');

const { apiEndpoint } = config.market.sources.kraken;

const getCandleStickKraken = async params => {
	if (!Object.keys(intervalToSecond).includes(params.interval)) throw new Error('invalid interval');
	let { symbol } = params;
	if (symbol === 'LSKUSDT') symbol = 'LSKUSD';
	const response = await requestLib(
		`${apiEndpoint}/public/OHLC?pair=${symbol}&interval=${Math.max(
			Math.floor(intervalToSecond[params.interval] / 60),
			1,
		)}&since=${Number(params.start)}`,
	);
	if (response && response.status === 200) {
		let data = response;
		if (typeof response === 'string') data = JSON.parse(data).data;
		else data = data.data;

		if (Object.keys(data).includes('error') && data.error.includes('EGeneral:Too many requests')) {
			await new Promise(res => setInterval(res, 2000));
			return getCandleStickKraken(params);
		}

		data = data.result[symbol].map(t => ({
			start: t[0],
			open: parseFloat(t[1]),
			high: parseFloat(t[2]),
			low: parseFloat(t[3]),
			close: parseFloat(t[4]),
			volume: parseFloat(t[6]),
			end: t[0] + intervalToSecond[params.interval],
		}));
		return data;
	}
	throw new ServiceUnavailableException('Data from Kraken is currently unavailable');
};

module.exports = {
	getCandleStickKraken,
};
