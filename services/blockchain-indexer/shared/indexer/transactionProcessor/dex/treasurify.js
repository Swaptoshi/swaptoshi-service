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
const { Logger } = require('klayr-service-framework');

const { TRANSACTION_STATUS } = require('../../../constants');

const logger = Logger();

const { getKlayr32AddressFromHexAddress } = require('../../../dataService/utils/account');
const { indexAccountAddress } = require('../../accountIndex');
const { parseSingleEvent } = require('../../utils/events');
const {
	MODULE_NAME_DEX,
	EVENT_NAME_TREASURIFY,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');

// Declare and export the following command specific constants
const COMMAND_NAME = 'treasurify';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const treasurifyEvent = parseSingleEvent(events, MODULE_NAME_DEX, EVENT_NAME_TREASURIFY, tx.id);

	const treasuryAddress = getKlayr32AddressFromHexAddress(treasurifyEvent.data.treasuryAddress);
	const poolAddress = getKlayr32AddressFromHexAddress(treasurifyEvent.data.poolAddress);

	logger.trace(`Updating index for the account with address ${treasuryAddress} asynchronously.`);
	indexAccountAddress(treasuryAddress);

	logger.trace(`Updating index for the account with address ${poolAddress} asynchronously.`);
	indexAccountAddress(poolAddress);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const treasurifyEvent = parseSingleEvent(events, MODULE_NAME_DEX, EVENT_NAME_TREASURIFY, tx.id);

	const treasuryAddress = getKlayr32AddressFromHexAddress(treasurifyEvent.data.treasuryAddress);
	const poolAddress = getKlayr32AddressFromHexAddress(treasurifyEvent.data.poolAddress);

	logger.trace(`Updating index for the account with address ${treasuryAddress} asynchronously.`);
	indexAccountAddress(treasuryAddress);

	logger.trace(`Updating index for the account with address ${poolAddress} asynchronously.`);
	indexAccountAddress(poolAddress);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
