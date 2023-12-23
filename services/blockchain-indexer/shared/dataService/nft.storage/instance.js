const { NFTStorage: NFTStorageAPI } = require('nft.storage');
const config = require('../../../config');

const NFT_STORAGE_API_KEY = config.nftStorage.apiKey;

class NFTStorage {
	static getInstance() {
		if (NFTStorage.instance === undefined) {
			NFTStorage.instance = new NFTStorageAPI({
				token: NFT_STORAGE_API_KEY,
			});
		}
		return NFTStorage.instance;
	}
}

module.exports = { NFTStorage };
