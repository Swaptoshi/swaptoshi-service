const dexPositionMetadata = require('./mappings/dexPositionMetadata');

module.exports = {
	type: 'moleculer',
	method: 'indexer.dex.positions.metadata',
	params: {
		tokenId: '=,string',
	},
	definition: {
		data: dexPositionMetadata,
		meta: {},
	},
};
