/* eslint-disable no-nested-ternary */
const intervalToSecond = {
	current: 0,
	'1s': 1,
	'1m': 60,
	'3m': 180,
	'5m': 300,
	'15m': 900,
	'30m': 1800,
	'1h': 3600,
	'2h': 7200,
	'4h': 14400,
	'6h': 21600,
	'8h': 28800,
	'12h': 43200,
	'24h': 86400,
	'1d': 86400,
	'3d': 259200,
	'7d': 604800,
	'1w': 604800,
	'1M': 2592000,
	'30d': 2592000,
	'1y': 31104000,
};

const normalizeBlockTime = (blockTime, interval) => {
	const second = intervalToSecond[interval] !== undefined ? intervalToSecond[interval] : 1;
	return blockTime - (blockTime % second);
};

module.exports = {
	intervalToSecond,
	normalizeBlockTime,
};
