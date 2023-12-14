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
} = require('lisk-service-framework');
const config = require('../../../../config');

const { TRANSACTION_STATUS } = require('../../../constants');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const logger = Logger();

const tokenFactoryTableSchema = require('../../../database/schema/token_factory');

const getTokenFactoryTable = () => getTableInstance(tokenFactoryTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'burn';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const tokenFactory = await getTokenFactoryTable();

	await tokenFactory.decrement(
		{
			decrement: { supply: BigInt(tx.params.amount) },
			where: { tokenID: tx.params.tokenId },
		},
		dbTrx,
	);

	logger.debug(`Decremented supply of: ${tx.params.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const tokenFactory = await getTokenFactoryTable();

	await tokenFactory.increment(
		{
			increment: { supply: BigInt(tx.params.amount) },
			where: { tokenID: tx.params.tokenId },
		},
		dbTrx,
	);

	logger.debug(`Incremented supply of: ${tx.params.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
