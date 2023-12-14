const { nftStorageUploadQueue } = require('./queue');

const nftStorageUpload = async params => {
	nftStorageUploadQueue.add({ data: params.data });
	return 200;
};

module.exports = { nftStorageUpload };
