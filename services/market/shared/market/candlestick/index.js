const {
	HTTP,
	Exceptions: { ServiceUnavailableException },
} = require('lisk-service-framework');

const requestLib = HTTP.request;

const config = require('../../../config');

const { apiEndpoint } = config.market.sources.binance;

const getCandleStick = async params => {
	const response = await requestLib(
		`${apiEndpoint}/klines?symbol=${params.symbol}&interval=${params.interval}&startTime=${
			Number(params.start) * 1000
		}&endTime=${Number(params.end) * 1000}&limit=1000`,
	);
	if (response && response.status === 200) {
		let data = response;
		if (typeof response === 'string') data = JSON.parse(data).data;
		else data = data.data;
		data = data.map(t => ({
			start: Math.floor(t[0] / 1000),
			open: parseFloat(t[1]),
			high: parseFloat(t[2]),
			low: parseFloat(t[3]),
			close: parseFloat(t[4]),
			volume: parseFloat(t[5]),
			end: Math.floor(t[6] / 1000),
		}));
		return data;
	}
	throw new ServiceUnavailableException('Data from Binance is currently unavailable');
};

module.exports = {
	getCandleStick,
};
