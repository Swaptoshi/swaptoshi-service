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
const { parseSingleEvent } = require('../../utils/events');
const {
	MODULE_NAME_TOKEN_FACTORY,
	EVENT_NAME_TOKEN_FACTORY_CREATE,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');
const { requestAppRegistry } = require('../../../utils/request');

const getTokenFactoryTable = () => getTableInstance(tokenFactoryTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'create';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const factoryCreatedEvent = parseSingleEvent(
		events,
		MODULE_NAME_TOKEN_FACTORY,
		EVENT_NAME_TOKEN_FACTORY_CREATE,
		tx.id,
	);

	const tokenFactory = await getTokenFactoryTable();
	const param = {
		transactionId: tx.id,
		tokenID: factoryCreatedEvent.data.tokenId,
		owner: factoryCreatedEvent.data.ownerAddress,
		supply: factoryCreatedEvent.data.amount,
	};

	const registryData = await requestAppRegistry('blockchain.apps.meta.tokens', {
		tokenID: factoryCreatedEvent.data.tokenId,
	});

	if (registryData.data.length > 0) {
		param.tokenName = registryData.data[0].tokenName;
		param.description = registryData.data[0].description;
		param.baseDenom = registryData.data[0].baseDenom;
		param.symbol = registryData.data[0].symbol;
		param.logoPng = registryData.data[0].logo.png;

		const decimal = registryData.data[0].denomUnits.find(
			t => t.denom === registryData.data[0].displayDenom,
		);
		if (decimal !== undefined) param.decimal = decimal.decimals;
	}

	await tokenFactory.upsert(param, dbTrx);

	logger.debug(`Added tokenId to index: ${factoryCreatedEvent.data.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const factoryCreatedEvent = parseSingleEvent(
		events,
		MODULE_NAME_TOKEN_FACTORY,
		EVENT_NAME_TOKEN_FACTORY_CREATE,
		tx.id,
	);

	const tokenFactory = await getTokenFactoryTable();

	await tokenFactory.deleteByPrimaryKey(tx.id, dbTrx);

	logger.debug(`Removed tokenId from index: ${factoryCreatedEvent.data.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
