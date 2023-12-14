const dexPositionValue = require('./mappings/dexPositionValue');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.positions.value',
	params: {
		tokenId: '=,string',
	},
	definition: {
		data: dexPositionValue,
		meta: {},
	},
};
