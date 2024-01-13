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
const BluebirdPromise = require('bluebird');

const config = require('../../../../config');

const { TRANSACTION_STATUS } = require('../../../constants');

const {
	MODULE_NAME_DEX,
	EVENT_NAME_POOL_CREATED,
	EVENT_NAME_POOL_INITIALIZED,
	EVENT_NAME_TOKEN_REGISTERED,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const logger = Logger();

const poolTableSchema = require('../../../database/schema/pool');
const dexTokenTableSchema = require('../../../database/schema/registeredDexToken');
const { decodePriceSqrt } = require('../../utils/priceFormatter');
const { parseSingleEvent, parseEvents } = require('../../utils/events');
const { decodePoolAddress, computePoolId } = require('../../utils/poolAddress');
const { getTokenFactoriesMeta } = require('../../../dataService/tokenFactory');
const { initializePoolTickTable } = require('../../../dataService/dex/tickIndexer');

const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'createPool';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const tokenRegisteredEvent = parseEvents(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_TOKEN_REGISTERED,
		tx.id,
	);

	const tokenTable = await getDEXTokenTable();

	await BluebirdPromise.map(
		tokenRegisteredEvent,
		async event => {
			let logo = null;

			try {
				const tokenMetadata = await getTokenFactoriesMeta({
					tokenIds: event.data.tokenId,
					registry: true,
				});
				if (tokenMetadata.data.length > 0) logo = tokenMetadata.data[0].logo.png;
			} catch (err) {
				logger.debug(`Error retrieving tokenMetadata: ${err.message}`);
			}

			await tokenTable.upsert(
				{
					tokenId: event.data.tokenId,
					symbol: event.data.symbol,
					decimal: event.data.decimal,
					logo,
				},
				dbTrx,
			);

			logger.debug(`Added registered token to index: ${event.data.tokenId}`);
			return true;
		},
		{ concurrency: tokenRegisteredEvent.length },
	);

	const poolCreatedEventData = parseSingleEvent(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_POOL_CREATED,
		tx.id,
	);

	const poolInitializedEventData = parseSingleEvent(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_POOL_INITIALIZED,
		tx.id,
	);

	const poolTable = await getPoolTable();

	const feeHex = Buffer.allocUnsafe(3);
	feeHex.writeUIntBE(parseInt(poolCreatedEventData.data.fee, 10), 0, 3);
	const poolKey = decodePoolAddress(poolCreatedEventData.data.poolAddress);

	const [token0] = await tokenTable.find({ tokenId: poolKey.token0, limit: 1 }, ['decimal'], dbTrx);
	const [token1] = await tokenTable.find({ tokenId: poolKey.token1, limit: 1 }, ['decimal'], dbTrx);

	await poolTable.upsert(
		{
			token0: poolCreatedEventData.data.token0,
			token1: poolCreatedEventData.data.token1,
			fee: Number(poolCreatedEventData.data.fee),
			inverted: false,
			created: blockHeader.timestamp,
			poolAddress: poolCreatedEventData.data.poolAddress,
			collectionId: computePoolId(poolCreatedEventData.data.poolAddress),
			feeHex: feeHex.toString('hex'),
			tickSpacing: poolCreatedEventData.data.tickSpacing,
			tick: poolInitializedEventData.data.tick,
			liquidity: 0,
			price: decodePriceSqrt(
				poolInitializedEventData.data.sqrtPriceX96,
				token0.decimal,
				token1.decimal,
			),
		},
		dbTrx,
	);

	await poolTable.upsert(
		{
			token0: poolCreatedEventData.data.token1,
			token1: poolCreatedEventData.data.token0,
			fee: Number(poolCreatedEventData.data.fee),
			inverted: true,
			created: blockHeader.timestamp,
			poolAddress: poolCreatedEventData.data.poolAddress,
			collectionId: computePoolId(poolCreatedEventData.data.poolAddress),
			feeHex: feeHex.toString('hex'),
			tickSpacing: poolCreatedEventData.data.tickSpacing,
			tick: poolInitializedEventData.data.tick,
			liquidity: 0,
			price: decodePriceSqrt(
				poolInitializedEventData.data.sqrtPriceX96,
				token0.decimal,
				token1.decimal,
				true,
			),
		},
		dbTrx,
	);

	logger.debug(`Added pool to index: ${poolCreatedEventData.data.poolAddress}`);

	await initializePoolTickTable(poolCreatedEventData.data.poolAddress, dbTrx);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const tokenRegisteredEvent = parseEvents(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_TOKEN_REGISTERED,
		tx.id,
	);

	const tokenTable = await getDEXTokenTable();

	await BluebirdPromise.map(
		tokenRegisteredEvent,
		async event => {
			await tokenTable.deleteByPrimaryKey(event.data.tokenId, dbTrx);
			logger.debug(`Removed registered token from index: ${event.data.tokenId}`);
			return true;
		},
		{ concurrency: tokenRegisteredEvent.length },
	);

	const poolCreatedEventData = parseSingleEvent(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_POOL_CREATED,
		tx.id,
	);

	const poolTable = await getPoolTable();
	await poolTable.deleteByPrimaryKey(
		[
			poolCreatedEventData.data.token0,
			poolCreatedEventData.data.token1,
			Number(poolCreatedEventData.data.fee),
		],
		dbTrx,
	);

	await poolTable.deleteByPrimaryKey(
		[
			poolCreatedEventData.data.token1,
			poolCreatedEventData.data.token0,
			Number(poolCreatedEventData.data.fee),
		],
		dbTrx,
	);

	logger.debug(`Removed pool from index: ${poolCreatedEventData.data.poolAddress}`);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
