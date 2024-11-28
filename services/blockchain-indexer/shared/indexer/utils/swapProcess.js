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
const BluebirdPromise = require('bluebird');

const config = require('../../../config');

const {
	MODULE_NAME_DEX,
	EVENT_NAME_SWAP,
} = require('../../../../blockchain-connector/shared/sdk/constants/names');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const logger = Logger();

const EXCLUDED_ADDRESS = [
	'klywcryfecu7yyyggmuyqcetwxzgnz73ra5hf8cde', // positionManagerAddress
	'klyo5pdmf2zvezocqfyoejt37so5myqzqxfdke6go', // routerAddress
];

const poolTableSchema = require('../../database/schema/pool');
const dexTokenTableSchema = require('../../database/schema/registeredDexToken');
const volumeTableSchema = require('../../database/schema/volume');
const lastPriceTableSchema = require('../../database/schema/lastPrice');

const { parseEvents } = require('./events');
const { indexAccountAddress } = require('../accountIndex');
const { decodeFeeGrowth } = require('./priceFormatter');
const { decodePoolAddress, getTreasuryAddress } = require('./poolAddress');
const { getPrice } = require('../../dataService/dex/priceQuoter');
const { getKLYTokenID } = require('../../dataService/business/interoperability/blockchainApps');
const { getPriceAtTick } = require('./tickFormatter');

const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);

const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);

const getVolumeTable = () =>
	getTableInstance(volumeTableSchema.tableName, volumeTableSchema, MYSQL_ENDPOINT);

const getLastPriceTable = () =>
	getTableInstance(lastPriceTableSchema.tableName, lastPriceTableSchema, MYSQL_ENDPOINT);

// Implement the custom logic in the 'applyTransaction' method and export it
const applySwapEvent = async (blockHeader, events, dbTrx) => {
	const swapEvent = parseEvents(events, MODULE_NAME_DEX, EVENT_NAME_SWAP);
	const klyTokenId = await getKLYTokenID();
	const treasuryAddress = await getTreasuryAddress();

	const addressToIndex = new Set();
	swapEvent.forEach(event => {
		if (!EXCLUDED_ADDRESS.includes(event.data.senderAddress))
			addressToIndex.add(event.data.senderAddress); // sender
		if (!EXCLUDED_ADDRESS.includes(event.data.recipientAddress))
			addressToIndex.add(event.data.recipientAddress); // recipient
		addressToIndex.add(event.topics[1]); // poolAddress
		if (treasuryAddress) addressToIndex.add(treasuryAddress); // treasuryAddress
	});

	const volumeTable = await getVolumeTable();
	const tokenTable = await getDEXTokenTable();
	const poolTable = await getPoolTable();
	const lastPriceTable = await getLastPriceTable();

	await BluebirdPromise.map(
		swapEvent,
		async event => {
			const poolKey = decodePoolAddress(event.topics[1]);

			const [token0] = await tokenTable.find(
				{ tokenId: poolKey.token0, limit: 1 },
				['symbol', 'decimal'],
				dbTrx,
			);
			const [token1] = await tokenTable.find(
				{ tokenId: poolKey.token1, limit: 1 },
				['symbol', 'decimal'],
				dbTrx,
			);

			await volumeTable.upsert(
				{
					height: event.height,
					index: event.index,
					poolAddress: event.topics[1],
					sender: event.data.senderAddress,
					recipient: event.data.recipientAddress,
					time: blockHeader.timestamp,
					amount0: event.data.amount0,
					amount1: event.data.amount1,
					feeGrowth0: decodeFeeGrowth(
						(
							BigInt(event.data.feeGrowthGlobal0X128) -
							BigInt(event.data.feeGrowthGlobal0X128Before)
						).toString(),
						event.data.liquidity,
					),
					feeGrowth1: decodeFeeGrowth(
						(
							BigInt(event.data.feeGrowthGlobal1X128) -
							BigInt(event.data.feeGrowthGlobal1X128Before)
						).toString(),
						event.data.liquidity,
					),
				},
				dbTrx,
			);

			logger.debug(
				`Added new items to Volume index: ${event.data.amount0} ${token0.symbol} & ${event.data.amount1} ${token1.symbol} on pool ${event.topics[1]}`,
			);

			const updatedPrice = getPriceAtTick(event.data.tick, token0.decimal, token1.decimal);
			const updatedPriceInverse = getPriceAtTick(
				event.data.tick,
				token0.decimal,
				token1.decimal,
				true,
			);
			await poolTable.update({
				where: {
					token0: poolKey.token0,
					token1: poolKey.token1,
					fee: poolKey.fee,
				},
				updates: { price: updatedPrice, tick: event.data.tick, liquidity: event.data.liquidity },
			});

			await poolTable.update({
				where: {
					token0: poolKey.token1,
					token1: poolKey.token0,
					fee: poolKey.fee,
				},
				updates: {
					price: updatedPriceInverse,
					tick: event.data.tick,
					liquidity: event.data.liquidity,
				},
			});

			logger.debug(`Updated ${token0.symbol}/${token1.symbol} pool price to: ${updatedPrice}`);
			logger.debug(`Updated ${token0.symbol}/${token1.symbol} pool tick to: ${event.data.tick}`);

			if (poolKey.token0 !== klyTokenId) {
				const token0Price = await getPrice(poolKey.token0, klyTokenId);
				await lastPriceTable.update({
					where: { tokenId: poolKey.token0 },
					updates: { current: token0Price },
				});

				logger.debug(`Updated ${token0.symbol}/KLY current price to: ${token0Price}`);
			}

			if (poolKey.token1 !== klyTokenId) {
				const token1Price = await getPrice(poolKey.token1, klyTokenId);
				await lastPriceTable.update({
					where: { tokenId: poolKey.token1 },
					updates: { current: token1Price },
				});

				logger.debug(`Updated ${token1.symbol}/KLY current price to: ${token1Price}`);
			}

			return true;
		},
		{ concurrency: swapEvent.length },
	);

	addressToIndex.forEach(address => {
		logger.trace(`Updating index for the account with address ${address} asynchronously.`);
		indexAccountAddress(address);
	});

	Promise.resolve({ blockHeader });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertSwapEvent = async (blockHeader, events, dbTrx) => {
	const swapEvent = parseEvents(events, MODULE_NAME_DEX, EVENT_NAME_SWAP);
	const klyTokenId = await getKLYTokenID();
	const treasuryAddress = await getTreasuryAddress();

	const addressToIndex = new Set();
	swapEvent.forEach(event => {
		if (!EXCLUDED_ADDRESS.includes(event.data.senderAddress))
			addressToIndex.add(event.data.senderAddress); // sender
		if (!EXCLUDED_ADDRESS.includes(event.data.recipientAddress))
			addressToIndex.add(event.data.recipientAddress); // recipient
		addressToIndex.add(event.topics[1]); // poolAddress
		if (treasuryAddress) addressToIndex.add(treasuryAddress); // treasuryAddress
	});

	const volumeTable = await getVolumeTable();
	const tokenTable = await getDEXTokenTable();
	const poolTable = await getPoolTable();
	const lastPriceTable = await getLastPriceTable();

	await BluebirdPromise.map(
		swapEvent,
		async event => {
			const poolKey = decodePoolAddress(event.topics[1]);

			const [token0] = await tokenTable.find(
				{ tokenId: poolKey.token0, limit: 1 },
				['symbol', 'decimal'],
				dbTrx,
			);
			const [token1] = await tokenTable.find(
				{ tokenId: poolKey.token1, limit: 1 },
				['symbol', 'decimal'],
				dbTrx,
			);

			await volumeTable.delete(
				{
					height: event.height,
					index: event.index,
					poolAddress: event.topics[1],
					sender: event.data.senderAddress,
					recipient: event.data.recipientAddress,
					time: blockHeader.timestamp,
					amount0: event.data.amount0,
					amount1: event.data.amount1,
					feeGrowth0: decodeFeeGrowth(
						(
							BigInt(event.data.feeGrowthGlobal0X128) -
							BigInt(event.data.feeGrowthGlobal0X128Before)
						).toString(),
						event.data.liquidity,
					),
					feeGrowth1: decodeFeeGrowth(
						(
							BigInt(event.data.feeGrowthGlobal1X128) -
							BigInt(event.data.feeGrowthGlobal1X128Before)
						).toString(),
						event.data.liquidity,
					),
				},
				dbTrx,
			);

			logger.debug(
				`Removed items from Volume index: ${event.data.amount0} ${token0.symbol} & ${event.data.amount1} ${token1.symbol} on pool ${event.topics[1]}`,
			);

			const revertedPrice = getPriceAtTick(event.data.tickBefore, token0.decimal, token1.decimal);
			const revertedPriceInverse = getPriceAtTick(
				event.data.tickBefore,
				token0.decimal,
				token1.decimal,
				true,
			);

			await poolTable.update({
				where: {
					token0: poolKey.token0,
					token1: poolKey.token1,
					fee: poolKey.fee,
				},
				updates: {
					price: revertedPrice,
					tick: event.data.tickBefore,
					liquidity: event.data.liquidityBefore,
				},
			});

			await poolTable.update({
				where: {
					token0: poolKey.token1,
					token1: poolKey.token0,
					fee: poolKey.fee,
				},
				updates: {
					price: revertedPriceInverse,
					tick: event.data.tickBefore,
					liquidity: event.data.liquidityBefore,
				},
			});

			logger.debug(`Reverted ${token0.symbol}/${token1.symbol} pool price to: ${revertedPrice}`);
			logger.debug(
				`Reverted ${token0.symbol}/${token1.symbol} pool tick to: ${event.data.tickBefore}`,
			);

			if (poolKey.token0 !== klyTokenId) {
				const token0Price = await getPrice(poolKey.token0, klyTokenId);
				await lastPriceTable.update({
					where: { tokenId: poolKey.token0 },
					updates: { current: token0Price },
				});

				logger.debug(`Updated ${token0.symbol}/KLY current price to: ${token0Price}`);
			}

			if (poolKey.token1 !== klyTokenId) {
				const token1Price = await getPrice(poolKey.token1, klyTokenId);
				await lastPriceTable.update({
					where: { tokenId: poolKey.token1 },
					updates: { current: token1Price },
				});

				logger.debug(`Updated ${token1.symbol}/KLY current price to: ${token1Price}`);
			}

			return true;
		},
		{ concurrency: swapEvent.length },
	);

	addressToIndex.forEach(address => {
		logger.trace(`Updating index for the account with address ${address} asynchronously.`);
		indexAccountAddress(address);
	});

	Promise.resolve({ blockHeader });
};

module.exports = {
	applySwapEvent,
	revertSwapEvent,
};
