const { getTicksJson } = require('../../database/database-data/ticks');

const getPriceAtTick = (tick, inverted) => {
	const tickNum = Number(tick);
	const data = getTicksJson().find(t => t.tick === tickNum);
	if (data) {
		return inverted ? data.price1 : data.price0;
	}
	return undefined;
};

const getTickAtPrice = (price, inverted) => {
	const query = inverted ? 'price1' : 'price0';
	const data = getTicksJson().find(t => t[query] === price);
	if (data) {
		return data.tick;
	}
	return undefined;
};

module.exports = { getPriceAtTick, getTickAtPrice };
