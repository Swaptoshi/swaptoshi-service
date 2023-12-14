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

const {
	MODULE_NAME_DEX,
	EVENT_NAME_DEX_MINT,
	EVENT_NAME_INCREASE_LIQUIDITY,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const logger = Logger();

const dexTokenTableSchema = require('../../../database/schema/registeredDexToken');
const positionTableSchema = require('../../../database/schema/position');
const tvlTableSchema = require('../../../database/schema/tvl');
const tickTableSchema = require('../../../database/schema/tick');
const { parseSingleEvent } = require('../../utils/events');
const { getLisk32AddressFromPublicKey } = require('../../../utils/account');
const { computePoolAddress, getPoolKey, decodeNFTId } = require('../../utils/poolAddress');
const { getLisk32AddressFromHexAddress } = require('../../../dataService/utils/account');
const { indexAccountAddress } = require('../../accountIndex');
const { nftStorageUploadQueue } = require('../../../dataService/nft.storage');
const { invokeEndpoint } = require('../../../dataService/business/invoke');

const getPositionTable = () =>
	getTableInstance(positionTableSchema.tableName, positionTableSchema, MYSQL_ENDPOINT);

const getTVLTable = () =>
	getTableInstance(tvlTableSchema.tableName, tvlTableSchema, MYSQL_ENDPOINT);

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const getTickTable = () =>
	getTableInstance(tickTableSchema.tableName, tickTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'mint';

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

	const poolKey = getPoolKey(tx.params.token0, tx.params.token1, tx.params.fee);
	const senderAddress = getLisk32AddressFromPublicKey(tx.senderPublicKey);
	const poolAddress = getLisk32AddressFromHexAddress(computePoolAddress(poolKey));

	const positionTable = await getPositionTable();

	const { index: tokenIndex } = decodeNFTId(increaseLiquidityEvent.data.tokenId);
	const metadata = await invokeEndpoint('dex_getMetadata', {
		poolAddress,
		tokenId: tokenIndex.toString(),
	});
	nftStorageUploadQueue.add({
		data: Buffer.from(JSON.stringify(metadata, null, 0), 'utf8').toString('hex'),
	});

	await positionTable.upsert(
		{
			tokenId: increaseLiquidityEvent.data.tokenId,
			collectionId: decodeNFTId(increaseLiquidityEvent.data.tokenId).collectionId,
			owner: mintEvent.data.recipientAddress,
			name: metadata.name,
			description: metadata.description,
			image: metadata.image,
			tickUpper: mintEvent.data.tickUpper,
			tickLower: mintEvent.data.tickLower,
			liquidity: Number(increaseLiquidityEvent.data.liquidity),
		},
		dbTrx,
	);

	logger.debug(`Added position to index: ${increaseLiquidityEvent.data.tokenId}`);

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

	logger.trace(`Updating index for the account with address ${senderAddress} asynchronously.`);
	indexAccountAddress(senderAddress);

	logger.trace(`Updating index for the account with address ${poolAddress} asynchronously.`);
	indexAccountAddress(poolAddress);

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

	const positionTable = await getPositionTable();
	await positionTable.deleteByPrimaryKey(increaseLiquidityEvent.data.tokenId, dbTrx);

	logger.debug(`Removed position from index: ${increaseLiquidityEvent.data.tokenId}`);

	const tvlTable = await getTVLTable();
	const tokenTable = await getDEXTokenTable();

	const poolKey = getPoolKey(tx.params.token0, tx.params.token1, tx.params.fee);
	const senderAddress = getLisk32AddressFromPublicKey(tx.senderPublicKey);
	const poolAddress = getLisk32AddressFromHexAddress(computePoolAddress(poolKey));

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
		`Removed item from TVL index: ${increaseLiquidityEvent.data.amount0} ${token0.symbol}`,
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
		`Removed item from TVL index: ${increaseLiquidityEvent.data.amount1} ${token1.symbol}`,
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

	logger.trace(`Updating index for the account with address ${senderAddress} asynchronously.`);
	indexAccountAddress(senderAddress);

	logger.trace(`Updating index for the account with address ${poolAddress} asynchronously.`);
	indexAccountAddress(poolAddress);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
