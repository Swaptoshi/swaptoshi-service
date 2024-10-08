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
const BluebirdPromise = require('bluebird');
const {
	Logger,
	Exceptions: { ValidationException },
	Signals,
} = require('klayr-service-framework');

const logger = Logger();

const { getCurrentChainID } = require('./interoperability/chain');
const { normalizeTransaction } = require('./transactions');
const { getIndexedAccountInfo } = require('../utils/account');
const { requestConnector } = require('../../utils/request');
const { getKlayr32AddressFromPublicKey } = require('../../utils/account');
const { TRANSACTION_STATUS } = require('../../constants');
const { indexAccountPublicKey } = require('../../indexer/accountIndex');

let pendingTransactionsList = [];

const formatPendingTransaction = async transaction => {
	const normalizedTransaction = await normalizeTransaction(transaction);
	const senderAddress = getKlayr32AddressFromPublicKey(normalizedTransaction.senderPublicKey);
	const account = await getIndexedAccountInfo({ address: senderAddress }, ['name']);

	normalizedTransaction.sender = {
		address: senderAddress,
		publicKey: normalizedTransaction.senderPublicKey,
		name: account.name || null,
	};

	if (normalizedTransaction.params.recipientAddress) {
		const recipientAccount = await getIndexedAccountInfo(
			{ address: normalizedTransaction.params.recipientAddress },
			['publicKey', 'name'],
		);

		normalizedTransaction.meta = {
			recipient: {
				address: normalizedTransaction.params.recipientAddress,
				publicKey: recipientAccount ? recipientAccount.publicKey : null,
				name: recipientAccount ? recipientAccount.name : null,
			},
		};
	}

	indexAccountPublicKey(normalizedTransaction.senderPublicKey);
	normalizedTransaction.executionStatus = TRANSACTION_STATUS.PENDING;
	return normalizedTransaction;
};

const getPendingTransactionsFromNode = async () => {
	const response = await requestConnector('getTransactionsFromPool');
	const pendingTx = await BluebirdPromise.map(
		response,
		async transaction => formatPendingTransaction(transaction),
		{ concurrency: response.length },
	);
	return pendingTx;
};

const loadAllPendingTransactions = async () => {
	try {
		pendingTransactionsList = await getPendingTransactionsFromNode();
		logger.info(
			`Updated pending transaction cache with ${pendingTransactionsList.length} transactions.`,
		);
	} catch (err) {
		logger.error(`Failed to update the 'pendingTransactionsList' due to:\n${err.stack}`);
	}
};

const validateParams = async params => {
	const validatedParams = {};
	if (params.nonce && !params.senderAddress) {
		throw new ValidationException(
			'Nonce based retrieval is only possible along with senderAddress',
		);
	}

	if (params.id) validatedParams.id = params.id;
	if (params.address) validatedParams.address = params.address;
	if (params.senderAddress) validatedParams.senderAddress = params.senderAddress;
	if (params.recipientAddress) validatedParams.recipientAddress = params.recipientAddress;
	if (params.moduleCommand) validatedParams.moduleCommand = params.moduleCommand;

	// If receivingChainID is currentChainID then return all the transactions where receivingChainID = null
	if (params.receivingChainID) {
		const currentChainID = await getCurrentChainID();

		if (params.receivingChainID === currentChainID) {
			validatedParams.currentChainTransactions = true;
		} else {
			validatedParams.receivingChainID = params.receivingChainID;
		}
	}

	return validatedParams;
};

const getPendingTransactions = async params => {
	const pendingTransactions = {
		data: [],
		meta: { total: 0 },
	};

	if ('blockID' in params || 'timestamp' in params || 'height' in params) {
		return pendingTransactions;
	}

	const offset = Number(params.offset) || 0;
	const limit = Number(params.limit) || 10;

	const validatedParams = await validateParams(params);

	if (pendingTransactionsList.length) {
		// Filter according to the request params
		const filteredPendingTxs = pendingTransactionsList.filter(
			transaction =>
				(!validatedParams.id || transaction.id === validatedParams.id) &&
				(!validatedParams.senderAddress ||
					transaction.sender.address === validatedParams.senderAddress) &&
				(!validatedParams.recipientAddress ||
					transaction.params.recipientAddress === validatedParams.recipientAddress) &&
				(!validatedParams.address ||
					transaction.sender.address === validatedParams.address ||
					transaction.params.recipientAddress === validatedParams.address) &&
				(!validatedParams.moduleCommand ||
					transaction.moduleCommand === validatedParams.moduleCommand) &&
				(!validatedParams.receivingChainID ||
					transaction.params.receivingChainID === validatedParams.receivingChainID) &&
				(!validatedParams.currentChainTransactions || !transaction.params.receivingChainID),
		);

		pendingTransactions.data = filteredPendingTxs.slice(offset, offset + limit).map(transaction => {
			// Set the 'executionStatus'
			transaction.executionStatus = TRANSACTION_STATUS.PENDING;
			return transaction;
		});

		pendingTransactions.meta = {
			count: pendingTransactions.data.length,
			offset,
			total: filteredPendingTxs.length,
		};
	}
	return pendingTransactions;
};

const txPoolNewTransactionListener = async payload => {
	const [transaction] = payload.data;
	pendingTransactionsList.push(transaction);
};
Signals.get('txPoolNewTransaction').add(txPoolNewTransactionListener);

module.exports = {
	getPendingTransactions,
	loadAllPendingTransactions,
	formatPendingTransaction,

	// For unit test
	validateParams,
};
