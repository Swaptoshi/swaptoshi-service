const dataService = require('../../../shared/dataService');

const nftStorageUpload = async params => {
	const defaultReward = {
		data: {},
		meta: {},
	};

	const response = await dataService.nftStorageUpload(params);
	if (response.data) defaultReward.data = response.data;
	if (response.meta) defaultReward.meta = response.meta;

	return defaultReward;
};

module.exports = { nftStorageUpload };
