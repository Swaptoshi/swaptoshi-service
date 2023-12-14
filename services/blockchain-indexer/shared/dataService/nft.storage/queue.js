const { Logger, Queue } = require('lisk-service-framework');

const config = require('../../../config');
const { NFTStorage } = require('./instance');

const logger = Logger();

const NFT_STORAGE_API_KEY = config.nftStorage.apiKey;

/** @param {{data: string}} job */
const nftStorageUpload = async job => {
	if (NFT_STORAGE_API_KEY) {
		const res = await NFTStorage.getInstance().storeBlob(
			new Blob([Buffer.from(job.data, 'hex').toString('utf8')]),
		);
		logger.info(`uploaded to nft.storage: ${res.toString()}`);
	} else {
		logger.warn(`NFT_STORAGE_API_KEY is not configured, aborting nft.storage upload`);
	}
};

/** @param {{cid: string}} job */
const nftStorageDelete = async job => {
	if (NFT_STORAGE_API_KEY) {
		await NFTStorage.getInstance().delete(job.cid);
		logger.info(`successfully deleted from nft.storate: ${job.cid}`);
	} else {
		logger.warn(`NFT_STORAGE_API_KEY is not configured, aborting nft.storage delete`);
	}
};

const nftStorageUploadQueue = Queue(
	config.endpoints.cache,
	config.queue.nftStorageUpload.name,
	nftStorageUpload,
	config.queue.nftStorageUpload.concurrency,
);

const nftStorageDeleteQueue = Queue(
	config.endpoints.cache,
	config.queue.nftStorageDelete.name,
	nftStorageDelete,
	config.queue.nftStorageDelete.concurrency,
);

module.exports = { nftStorageUploadQueue, nftStorageDeleteQueue };
