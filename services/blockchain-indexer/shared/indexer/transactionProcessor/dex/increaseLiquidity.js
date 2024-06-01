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
	EVENT_NAME_INCREASE_LIQUIDITY,
	EVENT_NAME_DEX_MINT,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const logger = Logger();

const dexTokenTableSchema = require('../../../database/schema/registeredDexToken');
const tvlTableSchema = require('../../../database/schema/tvl');
const tickTableSchema = require('../../../database/schema/tick');
const positionTableSchema = require('../../../database/schema/position');

const { parseSingleEvent } = require('../../utils/events');
const { getKlayr32AddressFromPublicKey } = require('../../../utils/account');
const { decodePoolAddress } = require('../../utils/poolAddress');
const { getKlayr32AddressFromHexAddress } = require('../../../dataService/utils/account');
const { indexAccountAddress } = require('../../accountIndex');
const { syncPoolData } = require('../../utils/dexSync');

const getPositionTable = () =>
	getTableInstance(positionTableSchema.tableName, positionTableSchema, MYSQL_ENDPOINT);

const getTVLTable = () =>
	getTableInstance(tvlTableSchema.tableName, tvlTableSchema, MYSQL_ENDPOINT);

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const getTickTable = () =>
	getTableInstance(tickTableSchema.tableName, tickTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'increaseLiquidity';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const mintEvent = parseSingleEvent(events, MODULE_NAME_DEX, EVENT_NAME_DEX_MINT, tx.id);

	const increaseLiquidityEvent = parseSingleEvent(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_INCREASE_LIQUIDITY,
		tx.id,
	);

	const tvlTable = await getTVLTable();
	const tokenTable = await getDEXTokenTable();
	const positionTable = await getPositionTable();

	const poolKey = decodePoolAddress(tx.params.poolAddress);
	const senderAddress = getKlayr32AddressFromPublicKey(tx.senderPublicKey);
	const poolAddress = getKlayr32AddressFromHexAddress(tx.params.poolAddress);

	const [token0] = await tokenTable.find({ tokenId: poolKey.token0, limit: 1 }, ['symbol'], dbTrx);
	const [token1] = await tokenTable.find({ tokenId: poolKey.token1, limit: 1 }, ['symbol'], dbTrx);

	await tvlTable.upsert(
		{
			transactionId: tx.id,
			index: 0,
			time: blockHeader.timestamp,
			sender: senderAddress,
			poolAddress,
			amount: Number(increaseLiquidityEvent.data.amount0),
			tokenId: poolKey.token0,
		},
		dbTrx,
	);

	logger.debug(
		`Added new items to TVL index: ${increaseLiquidityEvent.data.amount0} ${token0.symbol}`,
	);

	await tvlTable.upsert(
		{
			transactionId: tx.id,
			index: 1,
			time: blockHeader.timestamp,
			sender: senderAddress,
			poolAddress,
			amount: Number(increaseLiquidityEvent.data.amount1),
			tokenId: poolKey.token1,
		},
		dbTrx,
	);

	logger.debug(
		`Added new items to TVL index: ${increaseLiquidityEvent.data.amount1} ${token1.symbol}`,
	);

	const tickTable = await getTickTable();

	await tickTable.upsert({
		poolAddress,
		tick: Number(mintEvent.data.tickLower),
		liquidityNet: Number(mintEvent.data.lowerLiquidityNet),
	});

	logger.debug(`Updated tickLower liquidity for tick: ${mintEvent.data.tickLower}`);

	await tickTable.upsert({
		poolAddress,
		tick: Number(mintEvent.data.tickUpper),
		liquidityNet: Number(mintEvent.data.upperLiquidityNet),
	});

	logger.debug(`Updated tickUpper liquidity for tick: ${mintEvent.data.tickUpper}`);

	await positionTable.increment(
		{
			increment: { liquidity: Number(increaseLiquidityEvent.data.liquidity) },
			where: { tokenId: increaseLiquidityEvent.data.tokenId },
		},
		dbTrx,
	);

	logger.debug(`Incremented liquidity for tokenId: ${increaseLiquidityEvent.data.tokenId}`);

	logger.trace(`Updating index for the account with address ${senderAddress} asynchronously.`);
	indexAccountAddress(senderAddress);

	logger.trace(`Updating index for the account with address ${poolAddress} asynchronously.`);
	indexAccountAddress(poolAddress);

	logger.trace(`Syncing pool: ${poolAddress}.`);
	await syncPoolData(poolAddress);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const mintEvent = parseSingleEvent(events, MODULE_NAME_DEX, EVENT_NAME_DEX_MINT, tx.id);

	const increaseLiquidityEvent = parseSingleEvent(
		events,
		MODULE_NAME_DEX,
		EVENT_NAME_INCREASE_LIQUIDITY,
		tx.id,
	);

	const tvlTable = await getTVLTable();
	const tokenTable = await getDEXTokenTable();
	const positionTable = await getPositionTable();

	const poolKey = decodePoolAddress(tx.params.poolAddress);
	const senderAddress = getKlayr32AddressFromPublicKey(tx.senderPublicKey);
	const poolAddress = getKlayr32AddressFromHexAddress(tx.params.poolAddress);

	const [token0] = await tokenTable.find({ tokenId: poolKey.token0, limit: 1 }, ['symbol'], dbTrx);
	const [token1] = await tokenTable.find({ tokenId: poolKey.token1, limit: 1 }, ['symbol'], dbTrx);

	await tvlTable.delete(
		{
			transactionId: tx.id,
			index: 0,
			time: blockHeader.timestamp,
			sender: senderAddress,
			poolAddress,
			amount: Number(increaseLiquidityEvent.data.amount0),
			tokenId: poolKey.token0,
		},
		dbTrx,
	);

	logger.debug(
		`Removed items from TVL index: ${increaseLiquidityEvent.data.amount0} ${token0.symbol}`,
	);

	await tvlTable.delete(
		{
			transactionId: tx.id,
			index: 1,
			time: blockHeader.timestamp,
			sender: senderAddress,
			poolAddress,
			amount: Number(increaseLiquidityEvent.data.amount1),
			tokenId: poolKey.token1,
		},
		dbTrx,
	);

	logger.debug(
		`Removed items from TVL index: ${increaseLiquidityEvent.data.amount1} ${token1.symbol}`,
	);

	const tickTable = await getTickTable();

	await tickTable.upsert({
		poolAddress,
		tick: Number(mintEvent.data.tickLower),
		liquidityNet: Number(mintEvent.data.lowerLiquidityNetBefore),
	});

	logger.debug(`Reverted tickLower liquidity for tick: ${mintEvent.data.tickLower}`);

	await tickTable.upsert({
		poolAddress,
		tick: Number(mintEvent.data.tickUpper),
		liquidityNet: Number(mintEvent.data.upperLiquidityNetBefore),
	});

	logger.debug(`Reverted tickUpper liquidity for tick: ${mintEvent.data.tickUpper}`);

	await positionTable.decrement(
		{
			decrement: { liquidity: Number(increaseLiquidityEvent.data.liquidity) },
			where: { tokenId: increaseLiquidityEvent.data.tokenId },
		},
		dbTrx,
	);

	logger.debug(`Decremented liquidity for tokenId: ${increaseLiquidityEvent.data.tokenId}`);

	logger.trace(`Updating index for the account with address ${senderAddress} asynchronously.`);
	indexAccountAddress(senderAddress);

	logger.trace(`Updating index for the account with address ${poolAddress} asynchronously.`);
	indexAccountAddress(poolAddress);

	logger.trace(`Syncing pool: ${poolAddress}.`);
	await syncPoolData(poolAddress);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
