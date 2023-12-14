const { nftStorageUpload } = require('./controllers/nftStorage');

module.exports = [
	{
		name: 'nft.storage.upload',
		controller: nftStorageUpload,
		params: {
			data: { optional: false, type: 'string' },
		},
	},
];
