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
/* eslint-disable mocha/max-top-level-suites */
/* eslint-disable import/no-dynamic-require */
const { resolve } = require('path');

const { tokenTransfer } = require('../../constants/csvExport');

const { blocks } = require('../../constants/blocks');
const { events } = require('../../constants/events');
const { transactions } = require('../../constants/transaction');

const fieldMappings = require('../../../shared/excelFieldMappings');

const { dateFromTimestamp, timeFromTimestamp } = require('../../../shared/helpers/time');

const mockedRequestFilePath = resolve(`${__dirname}/../../../shared/helpers/request`);

jest.mock('klayr-service-framework', () => {
	const actualKlayrServiceFramework = jest.requireActual('klayr-service-framework');
	return {
		...actualKlayrServiceFramework,
		DB: {
			...actualKlayrServiceFramework.DB,
			MySQL: {
				...actualKlayrServiceFramework.DB.MySQL,
				KVStore: {
					...actualKlayrServiceFramework.DB.MySQL.KVStore,
					getKeyValueTable: jest.fn(),
				},
			},
		},
		CacheRedis: jest.fn(),
		CacheLRU: jest.fn(() => ({
			set: jest.fn(),
			get: jest.fn(),
		})),
		Queue: jest.fn(),
	};
});

beforeEach(() => jest.resetModules());

const chainID = '04000000';
const txFeeTokenID = '0400000000000000';

describe('Test formatTransaction method', () => {
	it('should return a transaction normalized', async () => {
		const { formatTransaction } = require('../../../shared/transactionsExport');

		const formattedTx = await formatTransaction(
			tokenTransfer.toOther.sender,
			tokenTransfer.toOther.transaction,
			chainID,
			txFeeTokenID,
		);
		const expectedFields = Object.values(fieldMappings.transactionMappings).map(v =>
			v.key !== 'blockReward' ? v.key : undefined,
		);
		expect(Object.keys(formattedTx)).toEqual(expect.arrayContaining(expectedFields.filter(e => e)));
	});
});

describe('Test formatBlocks method', () => {
	it('should return a blocks normalized when called with valid blocks', async () => {
		const { formatBlocks } = require('../../../shared/transactionsExport');

		const normalizedBlocks = await formatBlocks(blocks);
		const expectedResponse = [
			{
				blockHeight: blocks[0].height,
				blockReward: blocks[0].reward,
				date: dateFromTimestamp(blocks[0].timestamp),
				time: timeFromTimestamp(blocks[0].timestamp),
			},
			{
				blockHeight: blocks[1].height,
				blockReward: blocks[1].reward,
				date: dateFromTimestamp(blocks[1].timestamp),
				time: timeFromTimestamp(blocks[1].timestamp),
			},
			{
				blockHeight: blocks[2].height,
				blockReward: blocks[2].reward,
				date: dateFromTimestamp(blocks[2].timestamp),
				time: timeFromTimestamp(blocks[2].timestamp),
			},
		];
		expect(normalizedBlocks).toEqual(expectedResponse);
	});

	it('should throw error when called with null', async () => {
		const { formatBlocks } = require('../../../shared/transactionsExport');
		expect(formatBlocks(null)).rejects.toThrow();
	});

	it('should throw error when called with undefined', async () => {
		const { formatBlocks } = require('../../../shared/transactionsExport');
		expect(formatBlocks(undefined)).rejects.toThrow();
	});
});

describe('Test getBlockRewardEntries method', () => {
	const address = 'klyyvvam5rxyvbvofxbdfcupxetzmqxu22phm4yuo';
	it('should return block reward entries when token minted', async () => {
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return {
						posTokenID: '0400000000000000',
					};
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getBlockRewardEntries } = require('../../../shared/transactionsExport');

		const blockRewardEntries = await getBlockRewardEntries(
			address,
			events.tokenMintedEvent,
			null,
			blocks[0],
		);

		const expectedResult = [
			{
				amount: '161000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'Block generation reward (commission + self-stake)',
				receivingChainID: '04000000',
				recipientAddress: 'klyyvvam5rxyvbvofxbdfcupxetzmqxu22phm4yuo',
				recipientPublicKey: '7fb87fd7fdfef8037d9b6ca705d17000b9f639b4c7aa6f13383d178c783bbdfd',
				senderAddress: null,
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: null,
				txFeeTokenID: null,
			},
		];

		expect(blockRewardEntries).toHaveLength(1);
		expect(blockRewardEntries).toEqual(expectedResult);
	});

	it('should return block reward entries when token minted and locked', async () => {
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return {
						posTokenID: '0400000000000000',
					};
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getBlockRewardEntries } = require('../../../shared/transactionsExport');

		const blockRewardEntries = await getBlockRewardEntries(
			address,
			events.tokenMintedEvent,
			events.tokenLockedEvent,
			blocks[0],
		);
		const expectedResult = [
			{
				amount: '30000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'Block generation reward (commission + self-stake)',
				receivingChainID: '04000000',
				recipientAddress: 'klyyvvam5rxyvbvofxbdfcupxetzmqxu22phm4yuo',
				recipientPublicKey: '7fb87fd7fdfef8037d9b6ca705d17000b9f639b4c7aa6f13383d178c783bbdfd',
				senderAddress: null,
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: null,
				txFeeTokenID: null,
			},
			{
				amount: '131000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'Block generation reward (custodial shared rewards locked)',
				receivingChainID: '04000000',
				recipientAddress: 'klyyvvam5rxyvbvofxbdfcupxetzmqxu22phm4yuo',
				recipientPublicKey: '7fb87fd7fdfef8037d9b6ca705d17000b9f639b4c7aa6f13383d178c783bbdfd',
				senderAddress: null,
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: null,
				txFeeTokenID: null,
			},
		];

		expect(blockRewardEntries).toHaveLength(2);
		expect(blockRewardEntries).toEqual(expectedResult);
	});
});

describe('Test getChainInfo method', () => {
	it('should return chain info when called with valid chainID', async () => {
		const validChainID = '04000000';

		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestAppRegistry() {
					return {
						data: [
							{
								chainName: 'klayr_mainchain',
								displayName: 'Klayr',
								chainID: '04000000',
								title: 'Klayr - Devnet',
								description: 'Metadata configuration for the Klayr blockchain (mainchain) in devnet',
								networkType: 'devnet',
								isDefault: true,
							},
						],
					};
				},
			};
		});

		const { getChainInfo } = require('../../../shared/transactionsExport');

		const chainInfo = await getChainInfo(validChainID);
		const expectedResponse = {
			chainName: 'klayr_mainchain',
			chainID: '04000000',
		};
		expect(chainInfo).toEqual(expectedResponse);
	});
});

describe('Test getGeneratorFeeEntries method', () => {
	const address = 'klyme8ohf9geuno8nwpvdqm8wr8bvz5nzguftwpxp';
	it('should return generator fee reward entries', async () => {
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return '0400000000000000';
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getGeneratorFeeEntries } = require('../../../shared/transactionsExport');

		const generatorFeeEntries = await getGeneratorFeeEntries(
			address,
			events.genFeeProcessed,
			transactions.tokenTransfer,
			blocks[0],
		);

		const expectedResult = [
			{
				amount: '21000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'Generator Fee',
				receivingChainID: '04000000',
				recipientAddress: 'klyme8ohf9geuno8nwpvdqm8wr8bvz5nzguftwpxp',
				recipientPublicKey: null,
				senderAddress: 'klymv6entvj8cnrhfdoa38ojx34pv4rd9q44788r7',
				senderPublicKey: '1a315a7c7ccfb44ee0730f22cac4370307a7ef29710b938cff52e653cac753ad',
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: 'd41e8fbb909fdf44ffccef6f5b0fb5edf853f0dcf699243a0a92403d2a4f1d1d',
				txFeeTokenID: null,
			},
		];

		expect(generatorFeeEntries).toEqual(expectedResult);
	});
});

describe('Test getSharedRewardsAssignedEntries method', () => {
	const address = 'klyyvvam5rxyvbvofxbdfcupxetzmqxu22phm4yuo';
	it('should return shared reward entries', async () => {
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return {
						posTokenID: '0400000000000000',
					};
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getSharedRewardsAssignedEntries } = require('../../../shared/transactionsExport');

		const sharedRewardsAssignedEntries = await getSharedRewardsAssignedEntries(
			address,
			events.rewardsAssigned,
			transactions.claimedRewards,
			blocks[0],
		);

		const expectedResult = [
			{
				amount: '-87694485125',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'Custodial shared rewards transfer to the staker',
				receivingChainID: '04000000',
				recipientAddress: 'klymg3sdmjp4smz6x9k2cuyuwags5ehgtexe4w2ds',
				recipientPublicKey: 'f0fda0461215e4e63a68d12c79d293833c32519cfe3a5e01ca08b0a0a7493de5',
				senderAddress: 'kly26s9p9rb74ygzxayuf9cx6x7x5wuvp2v9yrns7',
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: '732923c6e8780251c1dcd179e3e657827ae9318a6df920de595d743f1ed70a40',
				txFeeTokenID: null,
			},
		];

		expect(sharedRewardsAssignedEntries).toEqual(expectedResult);
	});
});

describe('Test getMessageFeeEntries method', () => {
	const address = 'klyme8ohf9geuno8nwpvdqm8wr8bvz5nzguftwpxp';
	const sendingChainID = '04000000';
	const receivingChainID = '04000000';
	const messageFeeTokenID = '0400000000000000';

	it('should return message fee entries', async () => {
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return '0400000000000000';
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getMessageFeeEntries } = require('../../../shared/transactionsExport');

		const messageFeeEntries = await getMessageFeeEntries(
			address,
			events.relayerFeeProcessed,
			transactions.tokenTransferCrossChain,
			blocks[0],
			messageFeeTokenID,
			sendingChainID,
			receivingChainID,
		);

		const expectedResult = [
			{
				amount: '50000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: 'token:transferCrossChain',
				note: 'Message fee for relayer',
				receivingChainID: '04000000',
				recipientAddress: 'klyme8ohf9geuno8nwpvdqm8wr8bvz5nzguftwpxp',
				recipientPublicKey: null,
				senderAddress: null,
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: '2ceda7b8ccfaa6c452651e6ba2e0a8acf88350aeeb0cde4da98701419e0657c6',
				txFeeTokenID: null,
			},
		];

		expect(messageFeeEntries).toEqual(expectedResult);
	});

	it('should return empty list when relayer amount is 0', async () => {
		const { getMessageFeeEntries } = require('../../../shared/transactionsExport');

		const messageFeeEntries = await getMessageFeeEntries(
			address,
			{
				...events.relayerFeeProcessed,
				data: { ...events.relayerFeeProcessed.data, relayerAmount: 0 },
			},
			transactions.tokenTransferCrossChain,
			blocks[0],
			messageFeeTokenID,
			sendingChainID,
			receivingChainID,
		);
		expect(messageFeeEntries).toHaveLength(0);
	});
});

describe('Test getOutgoingTransferCCEntries method', () => {
	const address = 'kly56p8e53k3kar8epeqwpbxa2yd4urn8ouzhfvgs';
	it('should return outgoing transfer cross chain entries with amount deducted', async () => {
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return '0400000000000000';
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getOutgoingTransferCCEntries } = require('../../../shared/transactionsExport');

		const outgoingTransferCCEntries = await getOutgoingTransferCCEntries(
			address,
			events.transferCrossChain,
			events.ccmSendSuccess,
			transactions.transferCrossChain,
			blocks[2],
		);

		const expectedResult = [
			{
				amount: '-100000000',
				amountTokenID: '0400000000000000',
				blockHeight: 21016494,
				date: '2024-01-02',
				fee: '-10000000',
				moduleCommand: 'token:transferCrossChain',
				note: '',
				receivingChainID: '04000002',
				recipientAddress: 'kly56p8e53k3kar8epeqwpbxa2yd4urn8ouzhfvgs',
				recipientPublicKey: '344c75738c096e4bd94459fe81eba45503382181d003a9d2c8be75a2f38b49fa',
				senderAddress: 'kly56p8e53k3kar8epeqwpbxa2yd4urn8ouzhfvgs',
				senderPublicKey: '344c75738c096e4bd94459fe81eba45503382181d003a9d2c8be75a2f38b49fa',
				sendingChainID: '04000000',
				time: '12:34:30',
				transactionID: '34548b99aa37a5a450712c7e3f1e13b62be872d65dd7a8c1d54859408ca4914b',
				txFeeTokenID: '0400000000000000',
			},
			{
				amount: '-109000',
				amountTokenID: '0400000000000000',
				blockHeight: 21016494,
				date: '2024-01-02',
				fee: null,
				moduleCommand: null,
				note: 'Message Fee',
				receivingChainID: '04000002',
				recipientAddress: null,
				recipientPublicKey: null,
				senderAddress: 'kly56p8e53k3kar8epeqwpbxa2yd4urn8ouzhfvgs',
				senderPublicKey: '344c75738c096e4bd94459fe81eba45503382181d003a9d2c8be75a2f38b49fa',
				sendingChainID: '04000000',
				time: '12:34:30',
				transactionID: '34548b99aa37a5a450712c7e3f1e13b62be872d65dd7a8c1d54859408ca4914b',
				txFeeTokenID: null,
			},
		];

		expect(outgoingTransferCCEntries).toEqual(expectedResult);
	});
});

describe('Test getIncomingTransferCCEntries method', () => {
	jest.mock(mockedRequestFilePath, () => {
		const actual = jest.requireActual(mockedRequestFilePath);
		return {
			...actual,
			requestConnector() {
				return '0400000000000000';
			},
			requestIndexer() {
				return {
					data: {
						chainID: '04000000',
					},
				};
			},
		};
	});

	const address = 'kly56p8e53k3kar8epeqwpbxa2yd4urn8ouzhfvgs';
	it('should return incoming transfer cross chain entries with amount added', async () => {
		const { getIncomingTransferCCEntries } = require('../../../shared/transactionsExport');

		const incomingTransferCCEntries = await getIncomingTransferCCEntries(
			address,
			events.ccmTransfer,
			transactions.submitMainchainCrossChainUpdate,
			blocks[2],
		);

		const expectedResult = [
			{
				amount: '100000000',
				amountTokenID: '0400000000000000',
				blockHeight: 21016494,
				date: '2024-01-02',
				fee: null,
				moduleCommand: null,
				note: 'Incoming CCM from specified CCU transactionID',
				receivingChainID: '04000002',
				recipientAddress: 'kly56p8e53k3kar8epeqwpbxa2yd4urn8ouzhfvgs',
				recipientPublicKey: null,
				senderAddress: 'kly56p8e53k3kar8epeqwpbxa2yd4urn8ouzhfvgs',
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '12:34:30',
				transactionID: 'd16d1cb5fa32df64988b4ab5de66b7d43c8fbfdaf043aca84d649f914d66189f',
				txFeeTokenID: null,
			},
		];

		expect(incomingTransferCCEntries).toEqual(expectedResult);
	});

	it('should return empty list when result is not successful', async () => {
		const { getIncomingTransferCCEntries } = require('../../../shared/transactionsExport');

		const incomingTransferCCEntries = await getIncomingTransferCCEntries(
			address,
			{ ...events.ccmTransfer, data: { ...events.ccmTransfer.data, result: 1 } },
			transactions.submitMainchainCrossChainUpdate,
			blocks[2],
		);
		expect(incomingTransferCCEntries).toHaveLength(0);
	});
});

describe('Test getLegacyAccountReclaimEntries method', () => {
	const address = 'klyqz6gpqfu9tb5yc2jtqmqvqp3x8ze35g99u2zfd';
	it('should return generator fee reward entries', async () => {
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return '0400000000000000';
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getLegacyAccountReclaimEntries } = require('../../../shared/transactionsExport');

		const legacyAccountReclaimEntries = await getLegacyAccountReclaimEntries(
			address,
			events.accountReclaimed,
			transactions.reclaim,
			blocks[0],
		);

		const expectedResult = [
			{
				amount: '100000000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'Legacy account balance reclaimed',
				receivingChainID: '04000000',
				recipientAddress: 'klyqz6gpqfu9tb5yc2jtqmqvqp3x8ze35g99u2zfd',
				recipientPublicKey: null,
				senderAddress: null,
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: '6cff643daaa2bd1112d1b4591abef3e62f9e4f6e37a260fcd7508ce6a06f061c',
				txFeeTokenID: null,
			},
		];

		expect(legacyAccountReclaimEntries).toEqual(expectedResult);
	});
});

describe('Test getPomEntries method', () => {
	it('should return PoM entries reward deduction', async () => {
		const address = 'klymjt3zuxo6rv3oc9qyanppe76hk22m8ca2ra7h5';
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return {
						posTokenID: '0400000000000000',
					};
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getPomEntries } = require('../../../shared/transactionsExport');

		const pomEntries = await getPomEntries(
			address,
			events.tokenTransfer,
			events.validatorPunished,
			transactions.reportMisbehavior,
			blocks[0],
		);

		const expectedResult = [
			{
				amount: '-100000000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'PoM punishment validator reward deduction',
				receivingChainID: '04000000',
				recipientAddress: 'klymjt3zuxo6rv3oc9qyanppe76hk22m8ca2ra7h5',
				recipientPublicKey: null,
				senderAddress: 'klymjt3zuxo6rv3oc9qyanppe76hk22m8ca2ra7h5',
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: 'ce7082673acce922263e0256e717dc151fe86a88c6827bf53d42038ee387eca1',
				txFeeTokenID: null,
			},
		];

		expect(pomEntries).toEqual(expectedResult);
	});

	it('should return PoM entries reward addition', async () => {
		const address = 'klyqz6gpqfu9tb5yc2jtqmqvqp3x8ze35g99u2zfd';
		jest.mock(mockedRequestFilePath, () => {
			const actual = jest.requireActual(mockedRequestFilePath);
			return {
				...actual,
				requestConnector() {
					return {
						posTokenID: '0400000000000000',
					};
				},
				requestIndexer() {
					return {
						data: {
							chainID: '04000000',
						},
					};
				},
			};
		});

		const { getPomEntries } = require('../../../shared/transactionsExport');

		const pomEntries = await getPomEntries(
			address,
			events.tokenTransfer,
			events.validatorPunished,
			transactions.reportMisbehavior,
			blocks[0],
		);

		const expectedResult = [
			{
				amount: '100000000',
				amountTokenID: '0400000000000000',
				blockHeight: 15,
				date: '2022-11-17',
				fee: null,
				moduleCommand: null,
				note: 'PoM successful report reward',
				receivingChainID: '04000000',
				recipientAddress: 'klymjt3zuxo6rv3oc9qyanppe76hk22m8ca2ra7h5',
				recipientPublicKey: null,
				senderAddress: 'klymjt3zuxo6rv3oc9qyanppe76hk22m8ca2ra7h5',
				senderPublicKey: null,
				sendingChainID: '04000000',
				time: '11:52:28',
				transactionID: 'ce7082673acce922263e0256e717dc151fe86a88c6827bf53d42038ee387eca1',
				txFeeTokenID: null,
			},
		];

		expect(pomEntries).toEqual(expectedResult);
	});
});
