const tickJson0 = require('./ticks-0.json');
const tickJson1 = require('./ticks-1.json');
const tickJson2 = require('./ticks-2.json');
const tickJson3 = require('./ticks-3.json');
const tickJson4 = require('./ticks-4.json');
const tickJson5 = require('./ticks-5.json');
const tickJson6 = require('./ticks-6.json');
const tickJson7 = require('./ticks-7.json');

const getTicksJson = () =>
	tickJson0.ticks
		.concat(tickJson1.ticks)
		.concat(tickJson2.ticks)
		.concat(tickJson3.ticks)
		.concat(tickJson4.ticks)
		.concat(tickJson5.ticks)
		.concat(tickJson6.ticks)
		.concat(tickJson7.ticks);

module.exports = { getTicksJson };
