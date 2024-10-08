/*
 * LiskHQ/lisk-service
 * Copyright © 2022 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
const {
	DB: {
		MySQL: { getTableInstance },
	},
	Exceptions: { InvalidParamsException },
} = require('klayr-service-framework');

const {
	address: { getKlayr32AddressFromPublicKey },
} = require('@klayr/cryptography');

const config = require('../../../../config');

const { requestConnector } = require('../../../utils/request');

const validatorsTableSchema = require('../../../database/schema/validators');

const { getRewardTokenID } = require('../dynamicReward');

const MYSQL_ENDPOINT = config.endpoints.mysqlReplica;

const getValidatorsTable = () => getTableInstance(validatorsTableSchema, MYSQL_ENDPOINT);

const getPosLockedRewards = async params => {
	const response = {
		data: [],
		meta: {
			count: 0,
			offset: 0,
			total: 0,
		},
	};

	// Params must contain either address or name or publicKey
	if (!Object.keys(params).some(param => ['address', 'name', 'publicKey'].includes(param))) {
		throw new InvalidParamsException('One of the params (address, name or publicKey) is required.');
	}

	// Process address
	let { address } = params;
	if (!address && params.name) {
		const validatorsTable = await getValidatorsTable();

		const queryParams = {
			name: params.name,
			limit: 1,
		};

		const dataRows = await validatorsTable.find(queryParams, ['address']);
		if (dataRows.length) [{ address }] = dataRows;
	}
	if (!address && params.publicKey) {
		address = getKlayr32AddressFromPublicKey(Buffer.from(params.publicKey, 'hex'));
	}

	const tokenID = await getRewardTokenID();

	if (!address || !tokenID) {
		return response;
	}
	const { reward } = await requestConnector('getPosLockedReward', { tokenID, address });
	response.data.push({
		reward,
		tokenID,
	});

	const totalResponseCount = response.data.length;
	response.data = response.data.slice(params.offset, params.offset + params.limit);

	response.meta = {
		count: response.data.length,
		offset: params.offset,
		total: totalResponseCount,
	};

	return response;
};

module.exports = {
	getPosLockedRewards,
};
