/*
 * LiskHQ/lisk-service
 * Copyright © 2021 Lisk Foundation
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
const { Logger, CacheLRU } = require('klayr-service-framework');
const {
	utils: { hash },
	address: { getKlayr32AddressFromPublicKey: getKlayr32AddressFromPublicKeyHelper },
	legacyAddress: { getFirstEightBytesReversed },
} = require('@klayr/cryptography');

const { PUBLIC_KEY, ADDRESS_KLAYR32 } = require('../regex');
const { requestAllCustom } = require('./requestAll');
const { MODULE, MODULE_SUB_STORE } = require('./constants');
const { requestConnector, requestIndexer } = require('./request');

const logger = Logger();

const NUM_MAX_CACHE_PUBLICKEY = 100000; // Approx. 30% of mainnet addresses at migration
const publicKeyCache = CacheLRU('publicKey', { max: NUM_MAX_CACHE_PUBLICKEY });

let tokenModuleData;
let loadingAssets = false;

const validateKlayr32Address = address =>
	typeof address === 'string' && ADDRESS_KLAYR32.test(address);

const validatePublicKey = publicKey => typeof publicKey === 'string' && PUBLIC_KEY.test(publicKey);

const getKlayr32AddressFromPublicKey = publicKey =>
	getKlayr32AddressFromPublicKeyHelper(Buffer.from(publicKey, 'hex'));

const getLegacyAddress = publicKey =>
	getFirstEightBytesReversed(hash(Buffer.from(publicKey, 'hex'))).toString('hex');

const getAddressFromParams = params =>
	params.address || getKlayr32AddressFromPublicKey(params.publicKey);

const checkIfAccountExists = async address => {
	const response = await requestIndexer('token.account.exists', { address });
	const { isExists } = response.data;
	return isExists;
};

const checkIfAccountHasTransactions = async address => {
	// Using getTransactions from chain.js introduces cyclic dependency
	const response = await requestIndexer('transactions', { address, limit: 1 });
	return !!response.data.length;
};

const checkIfAccountIsValidator = async address => {
	const response = await requestIndexer('pos.validators', { address, sort: 'commission:asc' });
	return !!response.data.length;
};

const getTokenBalancesAtGenesis = async () => {
	if (!tokenModuleData && !loadingAssets) {
		loadingAssets = true; // loadingAssets avoids repeated invocations

		// Asynchronously fetch the token module genesis assets and cache locally
		logger.info('Attempting to fetch and cache the token module genesis assets.');
		requestConnector('getGenesisAssetsLength', {
			module: MODULE.TOKEN,
			subStore: MODULE_SUB_STORE.TOKEN.USER,
		})
			.then(async genesisBlockAssetsLength => {
				const totalUsers = genesisBlockAssetsLength[MODULE.TOKEN][MODULE_SUB_STORE.TOKEN.USER];

				const response = await requestAllCustom(
					requestConnector,
					'getGenesisAssetByModule',
					{ module: MODULE.TOKEN, subStore: MODULE_SUB_STORE.TOKEN.USER, limit: 1000 },
					totalUsers,
				);

				tokenModuleData = response[MODULE_SUB_STORE.TOKEN.USER];
				loadingAssets = false;
				logger.info('Successfully cached token module genesis assets.');
			})
			.catch(err => {
				logger.warn(
					`Failed to fetch token module genesis assets. Will retry later.\nError: ${err.message}`,
				);
				logger.debug(err.stack);

				loadingAssets = false;
			});
	}

	return tokenModuleData;
};

const getOpeningBalances = async address => {
	const balancesAtGenesis = await getTokenBalancesAtGenesis();
	const balancesByAddress = balancesAtGenesis
		? balancesAtGenesis.filter(e => e.address === address)
		: await requestConnector('getTokenBalancesAtGenesis', { address });

	const openingBalances = balancesByAddress.map(e => {
		const { tokenID, availableBalance, lockedBalances } = e;
		const totalLockedBalance = lockedBalances.reduce(
			(total, balInfo) => total + BigInt(balInfo.amount),
			BigInt('0'),
		);

		const amount = BigInt(availableBalance) + totalLockedBalance;

		return { tokenID, amount: amount.toString() };
	});

	return openingBalances;
};

const cachePublicKey = async publicKey => {
	const address = getKlayr32AddressFromPublicKey(publicKey);
	await publicKeyCache.set(address, publicKey);
};

const getPublicKeyByAddress = async address => {
	const publicKey = await publicKeyCache.get(address);
	if (publicKey) return publicKey;

	return null;
};

module.exports = {
	validateKlayr32Address,
	validatePublicKey,
	getKlayr32AddressFromPublicKey,
	getLegacyAddress,
	getAddressFromParams,
	checkIfAccountExists,
	checkIfAccountHasTransactions,
	checkIfAccountIsValidator,
	getTokenBalancesAtGenesis,
	getOpeningBalances,
	cachePublicKey,
	getPublicKeyByAddress,
};
