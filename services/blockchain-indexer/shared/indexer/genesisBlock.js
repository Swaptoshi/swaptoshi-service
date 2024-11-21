/* eslint-disable no-nested-ternary */
/*
 * LiskHQ/lisk-service
 * Copyright © 2023 Lisk Foundation
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
const BluebirdPromise = require('bluebird');

const {
	DB: {
		MySQL: { getTableInstance },
	},
	Logger,
} = require('klayr-service-framework');
const { codec } = require('@klayr/codec');

const svg2img = require('svg2img');
const { MODULE, MODULE_SUB_STORE, getGenesisHeight } = require('../constants');
const { updateTotalStake, updateTotalSelfStake } = require('./transactionProcessor/pos/stake');
const { indexAccountPublicKey, triggerAccountUpdates } = require('./accountIndex');
const { updateTotalLockedAmounts } = require('./utils/blockchainIndex');
const LiquidityAmounts = require('./utils/dexLib/liquidity_amounts');
const TickMath = require('./utils/dexLib/tick_math');

const requestAll = require('../utils/requestAll');
const config = require('../../config');
const accountsTableSchema = require('../database/schema/accounts');
const accountBalancesTableSchema = require('../database/schema/accountBalances');
const stakesTableSchema = require('../database/schema/stakes');
const commissionsTableSchema = require('../database/schema/commissions');
const dexTokenTableSchema = require('../database/schema/registeredDexToken');
const poolTableSchema = require('../database/schema/pool');
const positionTableSchema = require('../database/schema/position');
const tickTableSchema = require('../database/schema/tick');
const tvlTableSchema = require('../database/schema/tvl');
const tokenFactoryTableSchema = require('../database/schema/token_factory');
const tokenMetadataTableSchema = require('../database/schema/token_metadata');

const { getKlayr32AddressFromPublicKey } = require('../utils/account');
const { requestConnector, requestGateway } = require('../utils/request');
const { INVALID_ED25519_KEY } = require('../constants');
const { getTokenFactoriesMeta, invokeEndpoint, isTokenAvailable } = require('../dataService');
const { computePoolAddress, computePoolId, decodeNFTId } = require('./utils/poolAddress');
const { getPriceAtTick } = require('./utils/tickFormatter');
const { getKlayr32AddressFromHexAddress } = require('../dataService/utils/account');
const { dexNFTAttributeSchema } = require('./schema');
const { factoryMetadataSchema } = require('../dataService/tokenFactory/schema');

const logger = Logger();

const MYSQL_ENDPOINT = config.endpoints.mysql;
const SERVICE_URL = config.serviceUrl;
const DEX_GENESIS_INDEXING_CONCURRENCY = 8;

const getStakesTable = () => getTableInstance(stakesTableSchema, MYSQL_ENDPOINT);
const getAccountsTable = () => getTableInstance(accountsTableSchema, MYSQL_ENDPOINT);
const getAccountBalancesTable = () => getTableInstance(accountBalancesTableSchema, MYSQL_ENDPOINT);
const getCommissionsTable = () => getTableInstance(commissionsTableSchema, MYSQL_ENDPOINT);
const getDEXTokenTable = () =>
	getTableInstance(dexTokenTableSchema.tableName, dexTokenTableSchema, MYSQL_ENDPOINT);
const getPoolTable = () =>
	getTableInstance(poolTableSchema.tableName, poolTableSchema, MYSQL_ENDPOINT);
const getPositionTable = () =>
	getTableInstance(positionTableSchema.tableName, positionTableSchema, MYSQL_ENDPOINT);
const getTickTable = () =>
	getTableInstance(tickTableSchema.tableName, tickTableSchema, MYSQL_ENDPOINT);
const getTVLTable = () =>
	getTableInstance(tvlTableSchema.tableName, tvlTableSchema, MYSQL_ENDPOINT);
const getTokenFactoryTable = () => getTableInstance(tokenFactoryTableSchema, MYSQL_ENDPOINT);
const getTokenMetadataTable = () => getTableInstance(tokenMetadataTableSchema, MYSQL_ENDPOINT);

let intervalTimeout;
const genesisAccountBalances = [];

const getGenesisAssetIntervalTimeout = () => intervalTimeout;

const indexTokenModuleAssets = async dbTrx => {
	logger.info('Starting to index the genesis assets from the Token module.');
	const genesisBlockAssetsLength = await requestConnector('getGenesisAssetsLength', {
		module: MODULE.TOKEN,
		subStore: MODULE_SUB_STORE.TOKEN.USER,
	});
	const totalUsers = genesisBlockAssetsLength[MODULE.TOKEN][MODULE_SUB_STORE.TOKEN.USER];
	const tokenModuleData = await requestAll(
		requestConnector,
		'getGenesisAssetByModule',
		{ module: MODULE.TOKEN, subStore: MODULE_SUB_STORE.TOKEN.USER, limit: 1000 },
		totalUsers,
	);
	const userSubStoreInfos = tokenModuleData[MODULE_SUB_STORE.TOKEN.USER];
	const tokenIDLockedAmountChangeMap = {};

	// eslint-disable-next-line no-restricted-syntax
	for (const userInfo of userSubStoreInfos) {
		const { address, tokenID, availableBalance, lockedBalances } = userInfo;
		const totalLockedBalance = lockedBalances.reduce(
			(acc, entry) => BigInt(acc) + BigInt(entry.amount),
			BigInt('0'),
		);

		// Add entry to index the genesis account balances
		const accountBalanceEntry = {
			address,
			tokenID,
			balance: BigInt(availableBalance) + BigInt(totalLockedBalance),
		};
		genesisAccountBalances.push(accountBalanceEntry);

		// eslint-disable-next-line no-restricted-syntax
		for (const lockedBalance of userInfo.lockedBalances) {
			if (!tokenIDLockedAmountChangeMap[tokenID]) {
				tokenIDLockedAmountChangeMap[tokenID] = BigInt(0);
			}
			tokenIDLockedAmountChangeMap[tokenID] += BigInt(lockedBalance.amount);
		}
	}

	await updateTotalLockedAmounts(tokenIDLockedAmountChangeMap, dbTrx);
	logger.info('Finished indexing all the genesis assets from the Token module.');
};

const isGeneratorKeyValid = generatorKey => generatorKey !== INVALID_ED25519_KEY;

const indexPosValidatorsInfo = async (numValidators, dbTrx) => {
	logger.debug('Starting to index the validators information from the genesis PoS module assets.');
	if (numValidators > 0) {
		const accountsTable = await getAccountsTable();
		const commissionsTable = await getCommissionsTable();

		const posModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.POS, subStore: MODULE_SUB_STORE.POS.VALIDATORS, limit: 1000 },
			numValidators,
		);

		const validators = posModuleData[MODULE_SUB_STORE.POS.VALIDATORS];
		const genesisHeight = await getGenesisHeight();

		const commissionEntries = await BluebirdPromise.map(
			validators,
			async validator => {
				// Index all valid public keys
				if (isGeneratorKeyValid(validator.generatorKey)) {
					const account = {
						address: getKlayr32AddressFromPublicKey(validator.generatorKey),
						publicKey: validator.generatorKey,
					};

					await accountsTable
						.upsert(account)
						.catch(() => indexAccountPublicKey(validator.generatorKey));
				}

				return {
					address: validator.address,
					commission: validator.commission,
					height: genesisHeight,
				};
			},
			{ concurrency: validators.length },
		);

		await commissionsTable.upsert(commissionEntries, dbTrx);
	}
	logger.debug('Finished indexing the validators information from the genesis PoS module assets.');
};

const indexPosStakesInfo = async (numStakers, dbTrx) => {
	logger.debug('Starting to index the stakes information from the genesis PoS module assets.');
	let totalStake = BigInt(0);
	let totalSelfStake = BigInt(0);

	if (numStakers > 0) {
		const stakesTable = await getStakesTable();

		const posModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.POS, subStore: MODULE_SUB_STORE.POS.STAKERS, limit: 1000 },
			numStakers,
		);
		const stakers = posModuleData[MODULE_SUB_STORE.POS.STAKERS];

		const allStakes = [];
		stakers.forEach(staker => {
			const { address: stakerAddress, stakes } = staker;
			stakes.forEach(stake => {
				const { validatorAddress, amount } = stake;

				allStakes.push({
					stakerAddress,
					validatorAddress,
					amount: BigInt(amount),
				});

				totalStake += BigInt(amount);
				if (stakerAddress === validatorAddress) {
					totalSelfStake += BigInt(amount);
				}
			});
		});

		await stakesTable.upsert(allStakes, dbTrx);
		logger.info(`Updated ${allStakes.length} stakes from the genesis block.`);
	}

	await updateTotalStake(totalStake, dbTrx);
	logger.info(`Updated total stakes at genesis: ${totalStake.toString()}.`);

	await updateTotalSelfStake(totalSelfStake, dbTrx);
	logger.info(`Updated total self-stakes information at genesis: ${totalSelfStake.toString()}.`);
	logger.debug('Finished indexing the stakes information from the genesis PoS module assets.');
};

const indexPosModuleAssets = async dbTrx => {
	logger.info('Starting to index the genesis assets from the PoS module.');
	const genesisBlockAssetsLength = await requestConnector('getGenesisAssetsLength', {
		module: MODULE.POS,
	});
	const numValidators = genesisBlockAssetsLength[MODULE.POS][MODULE_SUB_STORE.POS.VALIDATORS];
	const numStakers = genesisBlockAssetsLength[MODULE.POS][MODULE_SUB_STORE.POS.STAKERS];

	await indexPosValidatorsInfo(numValidators, dbTrx);
	await indexPosStakesInfo(numStakers, dbTrx);
	logger.info('Finished indexing all the genesis assets from the PoS module.');
};

const indexDexPoolInfo = async (numPools, numTokens, blockHeader, dbTrx) => {
	logger.debug('Starting to index the Pools information from the genesis DEX module assets.');

	if (numPools > 0) {
		const dexModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.DEX, subStore: MODULE_SUB_STORE.DEX.POOL, limit: 1000 },
			numPools,
		);
		const poolSubstoreInfos = dexModuleData[MODULE_SUB_STORE.DEX.POOL];

		const dexTokenModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.DEX, subStore: MODULE_SUB_STORE.DEX.TOKEN_SYMBOL, limit: 1000 },
			numTokens,
		);
		const tokenSymbolSubstoreInfos = dexTokenModuleData[MODULE_SUB_STORE.DEX.TOKEN_SYMBOL];

		const poolTable = await getPoolTable();

		await BluebirdPromise.map(
			poolSubstoreInfos,
			async infos => {
				const feeHex = Buffer.allocUnsafe(3);
				feeHex.writeUIntBE(parseInt(infos.fee, 10), 0, 3);

				const poolAddress = computePoolAddress({
					token0: infos.token0,
					token1: infos.token1,
					fee: infos.fee,
				});

				const token0Index = tokenSymbolSubstoreInfos.findIndex(t => t.tokenId === infos.token0);
				if (token0Index === -1) {
					throw new Error(
						`error when indexing dex pools: data for token ${infos.token0} is not found on tokenSymbolSubstore`,
					);
				}

				const token1Index = tokenSymbolSubstoreInfos.findIndex(t => t.tokenId === infos.token1);
				if (token1Index === -1) {
					throw new Error(
						`error when indexing dex pools: data for token ${infos.token1} is not found on tokenSymbolSubstore`,
					);
				}

				await poolTable.upsert(
					{
						token0: infos.token0,
						token1: infos.token1,
						fee: Number(infos.fee),
						inverted: false,
						created: blockHeader.timestamp,
						poolAddress: getKlayr32AddressFromHexAddress(poolAddress),
						collectionId: computePoolId(poolAddress),
						feeHex: feeHex.toString('hex'),
						tickSpacing: infos.tickSpacing,
						tick: infos.slot0.tick,
						liquidity: infos.liquidity,
						price: getPriceAtTick(
							infos.slot0.tick,
							tokenSymbolSubstoreInfos[token0Index].decimal,
							tokenSymbolSubstoreInfos[token1Index].decimal,
						),
					},
					dbTrx,
				);

				await poolTable.upsert(
					{
						token0: infos.token1,
						token1: infos.token0,
						fee: Number(infos.fee),
						inverted: true,
						created: blockHeader.timestamp,
						poolAddress: getKlayr32AddressFromHexAddress(poolAddress),
						collectionId: computePoolId(poolAddress),
						feeHex: feeHex.toString('hex'),
						tickSpacing: infos.tickSpacing,
						tick: infos.slot0.tick,
						liquidity: infos.liquidity,
						price: getPriceAtTick(
							infos.slot0.tick,
							tokenSymbolSubstoreInfos[token0Index].decimal,
							tokenSymbolSubstoreInfos[token1Index].decimal,
							true,
						),
					},
					dbTrx,
				);

				logger.debug(`Added pool to index: ${poolAddress}`);
			},
			{ concurrency: DEX_GENESIS_INDEXING_CONCURRENCY },
		);
	}

	logger.debug('Finished indexing the Pools information from the genesis DEX module assets.');
};

const indexDexRegisteredTokenInfo = async (numTokens, dbTrx) => {
	logger.debug('Starting to index the Token information from the genesis DEX module assets.');

	if (numTokens > 0) {
		const dexModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.DEX, subStore: MODULE_SUB_STORE.DEX.TOKEN_SYMBOL, limit: 1000 },
			numTokens,
		);
		const tokenSymbolSubstoreInfos = dexModuleData[MODULE_SUB_STORE.DEX.TOKEN_SYMBOL];

		const tokenTable = await getDEXTokenTable();

		await BluebirdPromise.map(
			tokenSymbolSubstoreInfos,
			async infos => {
				let logo = `${SERVICE_URL}/static/img/logo/${infos.symbol.toLowerCase()}.svg`;

				try {
					const tokenMetadata = await getTokenFactoriesMeta({
						tokenIds: infos.tokenId,
						registry: true,
					});
					if (tokenMetadata.data.length > 0) logo = tokenMetadata.data[0].logo.svg;
				} catch (err) {
					logger.debug(`Error retrieving tokenMetadata: ${err.message}`);
				}

				await tokenTable.upsert(
					{
						tokenId: infos.tokenId,
						symbol: infos.symbol,
						decimal: infos.decimal,
						logo,
					},
					dbTrx,
				);

				logger.debug(`Added registered token to index: ${infos.tokenId}`);
				return true;
			},
			{ concurrency: DEX_GENESIS_INDEXING_CONCURRENCY },
		);
	}

	logger.debug('Finished indexing the Token information from the genesis DEX module assets.');
};

const indexDexTickInfo = async (numTick, dbTrx) => {
	logger.debug('Starting to index the Tick information from the genesis DEX module assets.');

	if (numTick > 0) {
		const dexModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.DEX, subStore: MODULE_SUB_STORE.DEX.TICK_INFO, limit: 1000 },
			numTick,
		);
		const tickSubstoreInfo = dexModuleData[MODULE_SUB_STORE.DEX.TICK_INFO];

		const tickTable = await getTickTable();

		await BluebirdPromise.map(
			tickSubstoreInfo,
			async infos => {
				await tickTable.upsert(
					{
						poolAddress: infos.poolAddress,
						tick: Number(infos.tick),
						liquidityNet: Number(infos.liquidityNet),
					},
					dbTrx,
				);

				logger.debug(`Updated liquidity for tick: ${infos.tick}`);
				return true;
			},
			{ concurrency: DEX_GENESIS_INDEXING_CONCURRENCY },
		);
	}

	logger.debug('Finished indexing the Tick information from the genesis DEX module assets.');
};

const indexDexModuleAssets = async (blockHeader, dbTrx) => {
	logger.info('Starting to index the genesis assets from the DEX module.');
	const genesisBlockAssetsLength = await requestConnector('getGenesisAssetsLength', {
		module: MODULE.DEX,
	});
	const numTokens = genesisBlockAssetsLength[MODULE.DEX][MODULE_SUB_STORE.DEX.TOKEN_SYMBOL];
	const numPools = genesisBlockAssetsLength[MODULE.DEX][MODULE_SUB_STORE.DEX.POOL];
	const numTick = genesisBlockAssetsLength[MODULE.DEX][MODULE_SUB_STORE.DEX.TICK_INFO];

	await indexDexRegisteredTokenInfo(numTokens, dbTrx);
	await indexDexTickInfo(numTick, dbTrx);
	await indexDexPoolInfo(numPools, numTokens, blockHeader, dbTrx);

	logger.info('Finished indexing all the genesis assets from the DEX module.');
};

const indexTokenFactoryInfo = async (numFactory, dbTrx) => {
	logger.debug(
		'Starting to index the Factory information from the genesis TokenFactory module assets.',
	);

	if (numFactory > 0) {
		const tokenFactoryModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{
				module: MODULE.TOKEN_FACTORY,
				subStore: MODULE_SUB_STORE.TOKEN_FACTORY.FACTORY,
				limit: 1000,
			},
			numFactory,
		);
		const factorySubstoreInfo = tokenFactoryModuleData[MODULE_SUB_STORE.TOKEN_FACTORY.FACTORY];

		const tokenGenesisBlockAssetsLength = await requestConnector('getGenesisAssetsLength', {
			module: MODULE.TOKEN,
		});
		const totalSupply = tokenGenesisBlockAssetsLength[MODULE.TOKEN][MODULE_SUB_STORE.TOKEN.SUPPLY];
		const tokenModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.TOKEN, subStore: MODULE_SUB_STORE.TOKEN.SUPPLY, limit: 1000 },
			totalSupply,
		);
		const supplySubstoreInfos = tokenModuleData[MODULE_SUB_STORE.TOKEN.SUPPLY];

		await BluebirdPromise.map(
			factorySubstoreInfo,
			async infos => {
				const tokenFactory = await getTokenFactoryTable();
				const tokenMetadataTable = await getTokenMetadataTable();

				const metadataAttribute = infos.attributesArray.find(t => t.key === 'metadata');
				if (!metadataAttribute) {
					logger.debug(
						`No metadata attribute found on factorySubstore genesis assets with token id: ${infos.tokenId}`,
					);
					return;
				}

				const metadata = codec.decode(
					factoryMetadataSchema,
					Buffer.from(metadataAttribute.attributes, 'hex'),
				);

				const available = await isTokenAvailable(metadata);
				if (!available.data.available) {
					logger.debug('tokenName and/or symbol is not available');
					return;
				}

				const supplyIndex = supplySubstoreInfos.findIndex(t => t.tokenID === infos.tokenId);
				if (supplyIndex === -1) {
					throw new Error(
						`error indexing factory from genesis assets with tokenId ${infos.tokenId}: supply info not found`,
					);
				}

				const param = {
					...metadata,
					symbol: metadata.symbol.toUpperCase(),
					tokenID: infos.tokenId,
					owner: infos.owner,
					supply: Number(supplySubstoreInfos[supplyIndex].totalSupply),
				};

				const svgAttribute = infos.attributesArray.find(t => t.key === 'svg');
				if (!svgAttribute) {
					logger.debug(
						`No svg attribute found on factorySubstore genesis assets with token id: ${infos.tokenId}`,
					);
					return;
				}

				let pngBuffer = '';

				svg2img(
					Buffer.from(svgAttribute.attributes, 'hex').toString('utf8'),
					{ format: 'png', resvg: { fitTo: { mode: 'width', value: 64 } } },
					(error, buffer) => (pngBuffer = buffer),
				);

				await requestGateway('logo.save', {
					fileName: `${metadata.symbol.toLowerCase()}.svg`,
					data: svgAttribute.attributes.toString('hex'),
				});

				await requestGateway('logo.save', {
					fileName: `${metadata.symbol.toLowerCase()}.png`,
					data: pngBuffer.toString('hex'),
				});

				param.logoSvg = `${SERVICE_URL}/static/img/logo/${metadata.symbol.toLowerCase()}.svg`;
				param.logoPng = `${SERVICE_URL}/static/img/logo/${metadata.symbol.toLowerCase()}.png`;

				await tokenFactory.upsert(param, dbTrx);
				await tokenMetadataTable.upsert(
					{
						chainName: 'swaptoshi',
						network:
							infos.tokenId.slice(0, 2) === '00'
								? 'mainnet'
								: infos.tokenId.slice(0, 2) === '01'
								? 'testnet'
								: infos.tokenId.slice(0, 2) === '04'
								? 'devnet'
								: 'unknown',
						tokenName: metadata.tokenName,
						tokenID: infos.tokenId,
					},
					dbTrx,
				);

				logger.debug(`Added token logo and metadata to index: ${infos.tokenId}`);

				logger.debug(`Added tokenId to index: ${infos.tokenId}`);
			},
			{ concurrency: DEX_GENESIS_INDEXING_CONCURRENCY },
		);
	}

	logger.debug(
		'Finished indexing the Factory information from the genesis TokenFactory module assets.',
	);
};

const indexTokenFactoryModuleAssets = async dbTrx => {
	logger.info('Starting to index the genesis assets from the TokenFactory module.');
	const genesisBlockAssetsLength = await requestConnector('getGenesisAssetsLength', {
		module: MODULE.TOKEN_FACTORY,
	});
	const numFactory =
		genesisBlockAssetsLength[MODULE.TOKEN_FACTORY][MODULE_SUB_STORE.TOKEN_FACTORY.FACTORY];

	await indexTokenFactoryInfo(numFactory, dbTrx);

	logger.info('Finished indexing all the genesis assets from the TokenFactory module.');
};

const indexNFTPositionInfo = async (numTokens, numPools, blockHeader, dbTrx) => {
	logger.debug(
		'Starting to index the NFT Liquidity Positions information from the genesis NFT module assets.',
	);

	if (numTokens > 0) {
		const nftModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.NFT, subStore: MODULE_SUB_STORE.NFT.NFT, limit: 1000 },
			numTokens,
		);
		const nftSubstoreInfos = nftModuleData[MODULE_SUB_STORE.NFT.NFT];

		const dexModuleData = await requestAll(
			requestConnector,
			'getGenesisAssetByModule',
			{ module: MODULE.DEX, subStore: MODULE_SUB_STORE.DEX.POOL, limit: 1000 },
			numPools,
		);
		const poolSubstoreInfos = dexModuleData[MODULE_SUB_STORE.DEX.POOL];

		const positionTable = await getPositionTable();
		const tvlTable = await getTVLTable();

		await BluebirdPromise.map(
			nftSubstoreInfos,
			async infos => {
				const dexAttributeIndex = infos.attributesArray.findIndex(t => t.module === 'dex');
				if (dexAttributeIndex !== -1) {
					const dexAttribute = infos.attributesArray[dexAttributeIndex];

					const nftAttribute = codec.decode(
						dexNFTAttributeSchema,
						Buffer.from(dexAttribute.attributes, 'hex'),
					);
					const poolAddress = getKlayr32AddressFromHexAddress(
						computePoolAddress({
							token0: nftAttribute.token0.toString('hex'),
							token1: nftAttribute.token1.toString('hex'),
							fee: nftAttribute.fee,
						}),
					);

					const tokenId = Buffer.from(infos.nftID.substring(16), 'hex').readBigUInt64BE();

					const metadata = await invokeEndpoint({
						endpoint: 'dex_getMetadata',
						params: {
							poolAddress,
							tokenId: tokenId.toString(),
						},
					});

					const tokenURI = await invokeEndpoint({
						endpoint: 'dex_getTokenURI',
						params: {
							poolAddress,
							tokenId: tokenId.toString(),
						},
					});

					await positionTable.upsert(
						{
							tokenId: infos.nftID,
							collectionId: decodeNFTId(infos.nftID).collectionId,
							owner: getKlayr32AddressFromHexAddress(Buffer.from(infos.owner, 'hex')),
							name: metadata.data.name,
							description: metadata.data.description,
							image: metadata.data.image,
							tickUpper: nftAttribute.tickUpper,
							tickLower: nftAttribute.tickLower,
							liquidity: Number(nftAttribute.liquidity),
							tokenURI: tokenURI.data.tokenURI,
						},
						dbTrx,
					);

					logger.debug(`Added position to index: ${infos.nftID}`);

					const poolIndex = poolSubstoreInfos.findIndex(
						t =>
							t.token0 === nftAttribute.token0.toString('hex') &&
							t.token1 === nftAttribute.token1.toString('hex') &&
							t.fee === nftAttribute.fee,
					);

					if (poolIndex === -1) {
						throw new Error(
							`error indexing genesis NFT with id ${infos.nftID}: poolAddress not found`,
						);
					}

					const [amount0, amount1] = LiquidityAmounts.getAmountsForLiquidity(
						poolSubstoreInfos[poolIndex].slot0.sqrtPriceX96,
						TickMath.getSqrtRatioAtTick(nftAttribute.tickLower),
						TickMath.getSqrtRatioAtTick(nftAttribute.tickUpper),
						nftAttribute.liquidity,
					);

					await tvlTable.upsert(
						{
							transactionId: `genesisNFT_${infos.nftID}`,
							index: 0,
							time: blockHeader.timestamp,
							sender: getKlayr32AddressFromHexAddress(Buffer.from(infos.owner, 'hex')),
							poolAddress,
							amount: Number(amount0),
							tokenId: nftAttribute.token0.toString('hex'),
						},
						dbTrx,
					);

					logger.debug(
						`Added new items to TVL index: ${amount0} for tokenID ${nftAttribute.token0.toString(
							'hex',
						)}`,
					);

					await tvlTable.upsert(
						{
							transactionId: `genesisNFT_${infos.nftID}`,
							index: 1,
							time: blockHeader.timestamp,
							sender: getKlayr32AddressFromHexAddress(Buffer.from(infos.owner, 'hex')),
							poolAddress,
							amount: Number(amount1),
							tokenId: nftAttribute.token1.toString('hex'),
						},
						dbTrx,
					);

					logger.debug(
						`Added new items to TVL index: ${amount1} for tokenID ${nftAttribute.token1.toString(
							'hex',
						)}`,
					);
				}

				return true;
			},
			{ concurrency: DEX_GENESIS_INDEXING_CONCURRENCY },
		);
	}

	logger.debug(
		'Finished indexing the NFT Liquidity Positions information from the genesis NFT module assets.',
	);
};

const indexNFTModuleAssets = async (blockHeader, dbTrx) => {
	logger.info('Starting to index the genesis assets from the NFT module.');
	const genesisBlockAssetsLength = await requestConnector('getGenesisAssetsLength', {
		module: MODULE.NFT,
	});
	const numTokens = genesisBlockAssetsLength[MODULE.NFT][MODULE_SUB_STORE.NFT.NFT];

	const dexGenesisBlockAssetsLength = await requestConnector('getGenesisAssetsLength', {
		module: MODULE.DEX,
	});
	const numPools = dexGenesisBlockAssetsLength[MODULE.DEX][MODULE_SUB_STORE.DEX.POOL];

	await indexNFTPositionInfo(numTokens, numPools, blockHeader, dbTrx);

	logger.info('Finished indexing all the genesis assets from the NFT module.');
};

const indexGenesisBlockAssets = async (blockHeader, dbTrx) => {
	clearTimeout(intervalTimeout);
	logger.info('Starting to index the genesis assets.');
	intervalTimeout = setInterval(
		() => logger.info('Genesis assets indexing still in progress...'),
		5000,
	);
	await indexTokenModuleAssets(dbTrx);
	await indexPosModuleAssets(dbTrx);

	await indexTokenFactoryModuleAssets(dbTrx);
	await indexDexModuleAssets(blockHeader, dbTrx);
	await indexNFTModuleAssets(blockHeader, dbTrx);

	await triggerAccountUpdates();
	clearInterval(intervalTimeout);
	logger.info('Finished indexing all the genesis assets.');
};

let indexedGenesisAccountBalances;
const interval = setInterval(async () => {
	logger.debug(
		`indexedGenesisAccountBalances interval triggered. ${genesisAccountBalances.length} pending.`,
	);
	try {
		if (genesisAccountBalances.length) {
			if (indexedGenesisAccountBalances === false) return;
		} else {
			if (indexedGenesisAccountBalances === true) clearInterval(interval);
			return;
		}
		indexedGenesisAccountBalances = false;

		logger.info('Started indexing genesis account balances.');
		let numEntries = 0;
		const accountBalancesTable = await getAccountBalancesTable();
		while (genesisAccountBalances.length) {
			const accountBalanceEntry = genesisAccountBalances.shift();
			await accountBalancesTable
				.upsert(accountBalanceEntry)
				.then(() => {
					numEntries++;
				})
				.catch(err => {
					genesisAccountBalances.push(accountBalanceEntry);
					logger.warn(
						`Updating account balance for ${accountBalanceEntry.address} failed. Will retry.\nError: ${err.message}`,
					);
					logger.debug(`${numEntries} indexed so far, ${genesisAccountBalances.length} pending.`);
				});
		}

		indexedGenesisAccountBalances = true;
		logger.info(`Finished indexing genesis account balances. Added ${numEntries} entries.`);
	} catch (_) {
		// No actions required
	}
}, 5 * 60 * 1000);

module.exports = {
	getGenesisAssetIntervalTimeout,
	indexGenesisBlockAssets,

	// For testing
	indexTokenModuleAssets,
	indexPosModuleAssets,
};
