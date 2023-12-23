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
		logoPng: {
			dataType: 'string',
			fieldNumber: 6,
		},
	},
};

module.exports = { factoryMetadataSchema };
