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

const {
	MODULE_NAME_DEX,
	EVENT_NAME_TOKEN_URI_DESTROYED,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const logger = Logger();

const positionTableSchema = require('../../../database/schema/position');
const { parseSingleEvent } = require('../../utils/events');
const { getKlayr32AddressFromPublicKey } = require('../../../utils/account');

const getPositionTable = () =>
	getTableInstance(positionTableSchema.tableName, positionTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'burn';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const tokenUriDestroyedEvent = parseSingleEvent(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_TOKEN_URI_DESTROYED,
		tx.id,
	);

	const positionTable = await getPositionTable();

	await positionTable.upsert(
		{
			tokenId: tokenUriDestroyedEvent.data.tokenId,
			owner: null,
		},
		dbTrx,
	);

	logger.debug(`Changed position owner to null from index: ${tokenUriDestroyedEvent.data.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const senderAddress = getKlayr32AddressFromPublicKey(tx.senderPublicKey);

	const tokenUriDestroyedEvent = parseSingleEvent(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_TOKEN_URI_DESTROYED,
		tx.id,
	);

	const positionTable = await getPositionTable();

	await positionTable.upsert(
		{
			tokenId: tokenUriDestroyedEvent.data.tokenId,
			owner: senderAddress,
		},
		dbTrx,
	);

	logger.debug(`Revert position owner from index: ${tokenUriDestroyedEvent.data.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
