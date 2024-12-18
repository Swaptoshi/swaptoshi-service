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
	Logger,
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');
const config = require('../../../../config');

const { TRANSACTION_STATUS } = require('../../../constants');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const logger = Logger();

const positionTableSchema = require('../../../database/schema/position');
const {
	MODULE_NAME_NFT,
	EVENT_NAME_NFT_TRANSFER,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');
const { parseSingleEvent } = require('../../utils/events');

const getPositionTable = () =>
	getTableInstance(positionTableSchema.tableName, positionTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'transfer';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const transferEvent = parseSingleEvent(events, MODULE_NAME_NFT, EVENT_NAME_NFT_TRANSFER, tx.id);

	const positionTable = await getPositionTable();

	await positionTable.upsert(
		{
			tokenId: transferEvent.data.nftID,
			owner: transferEvent.data.recipientAddress,
		},
		dbTrx,
	);

	logger.debug(
		`Modified position owner with id ${transferEvent.data.nftID} to: ${transferEvent.data.recipientAddress}`,
	);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const transferEvent = parseSingleEvent(events, MODULE_NAME_NFT, EVENT_NAME_NFT_TRANSFER, tx.id);

	const positionTable = await getPositionTable();

	await positionTable.upsert(
		{
			tokenId: transferEvent.data.nftID,
			owner: transferEvent.data.senderAddress,
		},
		dbTrx,
	);

	logger.debug(
		`Reverted position owner with id ${transferEvent.data.nftID} back to: ${transferEvent.data.senderAddress}`,
	);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
