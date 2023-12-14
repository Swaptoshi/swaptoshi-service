const factoryMetadataSchema = {
	$id: 'service/factory/metadata',
	type: 'object',
	properties: {
		tokenName: {
			dataType: 'string',
			fieldNumber: 1,
		},
		description: {
			dataType: 'string',
			fieldNumber: 2,
		},
		decimal: {
			dataType: 'string',
			fieldNumber: 3,
		},
		baseDenom: {
			dataType: 'string',
			fieldNumber: 4,
		},
		symbol: {
			dataType: 'string',
			fieldNumber: 5,
		},
	},
};

module.exports = { factoryMetadataSchema };
