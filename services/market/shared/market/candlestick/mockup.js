/* eslint-disable import/no-unresolved */
const { Logger } = require('klayr-service-framework');
const { intervalToSecond } = require('../../utils/timestamp');

const logger = Logger();
const mockedPrice = 3.12;
const mockedVolume = 3123;

const getCandleStickMockup = async params => {
	const count = Math.floor(
		(Math.floor(Date.now() / 1000) - Number(params.start)) / intervalToSecond[params.interval],
	);
	const data = [];

	for (let i = 0; i < count; i++) {
		const start = Number(params.start) + intervalToSecond[params.interval] * i;

		logger.info(
			`candlestick price of ${params.symbol} at ${start} is mocked to ${mockedPrice} with volume mocked to ${mockedVolume}.`,
		);

		data.push({
			start,
			open: mockedPrice,
			high: mockedPrice,
			low: mockedPrice,
			close: mockedPrice,
			volume: mockedVolume,
		});
	}

	return data;
};

module.exports = {
	getCandleStickMockup,
};
