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
	MODULE_NAME_AUTH,
	EVENT_NAME_INVALID_SIGNATURE,
	EVENT_NAME_MULTISIGNATURE_REGISTERED,

	MODULE_NAME_VALIDATORS,
	EVENT_NAME_GENERATOR_KEY_REGISTRATION,
	EVENT_NAME_BLS_KEY_REGISTRATION,

	MODULE_NAME_TOKEN,
	EVENT_NAME_TRANSFER,
	EVENT_NAME_TRANSFER_CROSS_CHAIN,
	EVENT_NAME_CCM_TRANSFER,
	EVENT_NAME_MINT,
	EVENT_NAME_BURN,
	EVENT_NAME_LOCK,
	EVENT_NAME_UNLOCK,
	EVENT_NAME_INITIALIZE_TOKEN,
	EVENT_NAME_INITIALIZE_USER_ACCOUNT,
	EVENT_NAME_INITIALIZE_ESCROW_ACCOUNT,
	EVENT_NAME_RECOVER,
	EVENT_NAME_BEFORE_CCC_EXECUTION,
	EVENT_NAME_BEFORE_CCM_FORWARDING,
	EVENT_NAME_ALL_TOKENS_SUPPORTED,
	EVENT_NAME_ALL_TOKENS_SUPPORT_REMOVED,
	EVENT_NAME_ALL_TOKENS_FROM_CHAIN_SUPPORTED,
	EVENT_NAME_ALL_TOKENS_FROM_CHAIN_SUPPORT_REMOVED,
	EVENT_NAME_TOKEN_ID_SUPPORTED,
	EVENT_NAME_TOKEN_ID_SUPPORT_REMOVED,

	MODULE_NAME_FEE,
	EVENT_NAME_FEE_PROCESSED,
	EVENT_NAME_INSUFFICIENT_FEE,
	EVENT_NAME_RELAYER_FEE_PROCESSED,

	MODULE_NAME_INTEROPERABILITY,
	EVENT_NAME_INVALID_CERTIFICATE_SIGNATURE,
	EVENT_NAME_INVALID_REGISTRATION_SIGNATURE,
	EVENT_NAME_CHAIN_ACCOUNT_UPDATED,
	EVENT_NAME_CCM_SEND_SUCCESS,
	EVENT_NAME_CCM_SENT_FAILED,
	EVENT_NAME_CCM_PROCESSED,
	EVENT_NAME_TERMINATED_STATE_CREATED,
	EVENT_NAME_TERMINATED_OUTBOX_CREATED,

	MODULE_NAME_POS,
	EVENT_NAME_VALIDATOR_REGISTERED,
	EVENT_NAME_VALIDATOR_STAKED,
	EVENT_NAME_VALIDATOR_PUNISHED,
	EVENT_NAME_VALIDATOR_BANNED,
	EVENT_NAME_COMMISSION_CHANGE,
	EVENT_NAME_REWARDS_ASSIGNED,

	MODULE_NAME_RANDOM,

	MODULE_NAME_BLOCK_REWARDS,
	MODULE_NAME_DYNAMIC_BLOCK_REWARDS,
	EVENT_NAME_REWARD_MINTED,

	MODULE_NAME_LEGACY,
	EVENT_NAME_ACCOUNT_RECLAIMED,
	EVENT_NAME_KEYS_REGISTERED,

	MODULE_NAME_DEX,
	EVENT_NAME_POOL_CREATED,
	EVENT_NAME_TREASURIFY,
	EVENT_NAME_INCREASE_OBSERVATION_CARDINALITY_NEXT,
	EVENT_NAME_POOL_INITIALIZED,
	EVENT_NAME_DEX_MINT,
	EVENT_NAME_COLLECT,
	EVENT_NAME_DEX_BURN,
	EVENT_NAME_COLLECT_PROTOCOL,
	EVENT_NAME_SWAP,
	EVENT_NAME_FLASH,
	EVENT_NAME_INCREASE_LIQUIDITY,
	EVENT_NAME_DECREASE_LIQUIDITY,
	EVENT_NAME_TOKEN_URI_CREATED,
	EVENT_NAME_COLLECT_POSITION,
	EVENT_NAME_TOKEN_URI_DESTROYED,
	EVENT_NAME_TOKEN_REGISTERED,

	MODULE_NAME_NFT,
	EVENT_NAME_NFT_TRANSFER,
	MODULE_NAME_TOKEN_FACTORY,
	EVENT_NAME_TOKEN_FACTORY_CREATED,
	MODULE_NAME_FEE_CONVERSION,
	EVENT_NAME_FEE_CONVERTED,
	MODULE_NAME_LIQUID_POS,
	EVENT_NAME_LST_BURN,
	EVENT_NAME_LST_MINT,
	EVENT_NAME_AIRDROP_CREATED,
	EVENT_NAME_VESTED_TOKEN_UNLOCKED,
	EVENT_NAME_AIRDROP_DISTRIBUTED,
	EVENT_NAME_AIRDROP_RECIPIENTS_CHANGED,
	EVENT_NAME_TOKEN_FACTORY_OWNER_CHANGED,
	EVENT_NAME_ICO_CREATED,
	EVENT_NAME_ICO_DEPOSIT,
	EVENT_NAME_ICO_PRICE_CHANGED,
	EVENT_NAME_ICO_SWAP,
	EVENT_NAME_ICO_TREASURIFY,
	EVENT_NAME_ICO_WITHDRAW,
	EVENT_NAME_VESTED_TOKEN_LOCKED,
	EVENT_NAME_NFT_CREATE,
	EVENT_NAME_NFT_SET_ATTRIBUTE,
	EVENT_NAME_TOKEN_FACTORY_SET_ATTRIBUTES,
	MODULE_NAME_GOVERNANCE,
	EVENT_NAME_TREASURY_BLOCK_REWARD_TAX,
	EVENT_NAME_TREASURY_MINT,
} = require('./names');

const COMMAND_EXECUTION_RESULT_TOPICS = ['transactionID'];

const EVENT_TOPIC_MAPPINGS_BY_MODULE = {
	[MODULE_NAME_DEX]: {
		[EVENT_NAME_POOL_CREATED]: ['transactionID', 'poolAddress'],
		[EVENT_NAME_TREASURIFY]: ['transactionID', 'poolAddress', 'treasuryAddress'],
		[EVENT_NAME_INCREASE_OBSERVATION_CARDINALITY_NEXT]: ['transactionID', 'poolAddress'],
		[EVENT_NAME_POOL_INITIALIZED]: ['transactionID', 'poolAddress'],
		[EVENT_NAME_DEX_MINT]: ['transactionID', 'poolAddress', 'recipientAddress'],
		[EVENT_NAME_COLLECT]: ['transactionID', 'poolAddress', 'recipientAddress'],
		[EVENT_NAME_DEX_BURN]: ['transactionID', 'poolAddress', 'senderAddress'],
		[EVENT_NAME_COLLECT_PROTOCOL]: ['transactionID', 'poolAddress', 'treasuryAddress'],
		[EVENT_NAME_SWAP]: ['transactionID', 'poolAddress', 'senderAddress'],
		[EVENT_NAME_FLASH]: ['transactionID', 'poolAddress', 'recipientAddress'],
		[EVENT_NAME_INCREASE_LIQUIDITY]: ['transactionID', 'poolAddress', 'senderAddress'],
		[EVENT_NAME_DECREASE_LIQUIDITY]: ['transactionID', 'poolAddress', 'senderAddress'],
		[EVENT_NAME_TOKEN_URI_CREATED]: ['transactionID', 'senderAddress'],
		[EVENT_NAME_COLLECT_POSITION]: ['transactionID', 'poolAddress', 'recipientAddress'],
		[EVENT_NAME_TOKEN_URI_DESTROYED]: ['transactionID', 'poolAddress', 'senderAddress'],
		[EVENT_NAME_TOKEN_REGISTERED]: ['transactionID', 'tokenID'],
	},
	[MODULE_NAME_NFT]: {
		[EVENT_NAME_NFT_TRANSFER]: ['transactionID', 'senderAddress', 'recipientAddress'],
		[EVENT_NAME_NFT_CREATE]: ['transactionID', 'recipientAddress', 'NFTID'],
		[EVENT_NAME_NFT_SET_ATTRIBUTE]: ['transactionID', 'NFTID'],
	},
	[MODULE_NAME_TOKEN_FACTORY]: {
		[EVENT_NAME_AIRDROP_CREATED]: ['transactionID', 'providerAddress'],
		[EVENT_NAME_AIRDROP_DISTRIBUTED]: ['transactionID', 'recipientAddress', 'senderAddress'],
		[EVENT_NAME_AIRDROP_RECIPIENTS_CHANGED]: ['transactionID', 'recipientAddress'],
		[EVENT_NAME_TOKEN_FACTORY_CREATED]: ['transactionID', 'senderAddress'],
		[EVENT_NAME_TOKEN_FACTORY_SET_ATTRIBUTES]: ['transactionID', 'ownerAddress', 'tokenID'],
		[EVENT_NAME_TOKEN_FACTORY_OWNER_CHANGED]: ['transactionID', 'ownerAddress'],
		[EVENT_NAME_ICO_CREATED]: ['transactionID', 'providerAddress'],
		[EVENT_NAME_ICO_DEPOSIT]: ['transactionID', 'poolAddress'],
		[EVENT_NAME_ICO_PRICE_CHANGED]: ['transactionID', 'poolAddress'],
		[EVENT_NAME_ICO_SWAP]: ['transactionID', 'poolAddress', 'providerAddress', 'recipientAddress'],
		[EVENT_NAME_ICO_TREASURIFY]: ['transactionID', 'poolAddress', 'leftOverAddress'],
		[EVENT_NAME_ICO_WITHDRAW]: ['transactionID', 'poolAddress'],
		[EVENT_NAME_VESTED_TOKEN_LOCKED]: ['transactionID', 'recipientAddress'],
		[EVENT_NAME_VESTED_TOKEN_UNLOCKED]: ['transactionID', 'senderAddress'],
	},
	[MODULE_NAME_FEE_CONVERSION]: {
		[EVENT_NAME_FEE_CONVERTED]: ['transactionID', 'senderAddress'],
	},
	[MODULE_NAME_LIQUID_POS]: {
		[EVENT_NAME_LST_BURN]: ['transactionID', 'senderAddress'],
		[EVENT_NAME_LST_MINT]: ['transactionID', 'senderAddress'],
	},
	[MODULE_NAME_GOVERNANCE]: {
		[EVENT_NAME_TREASURY_BLOCK_REWARD_TAX]: ['defaultTopic', 'treasuryAddress', 'generatorAddress'],
		[EVENT_NAME_TREASURY_MINT]: ['defaultTopic', 'treasuryAddress'],
	},
	[MODULE_NAME_AUTH]: {
		[EVENT_NAME_MULTISIGNATURE_REGISTERED]: ['transactionID', 'senderAddress'],
		[EVENT_NAME_INVALID_SIGNATURE]: ['transactionID', 'senderAddress'],
	},
	[MODULE_NAME_VALIDATORS]: {
		[EVENT_NAME_GENERATOR_KEY_REGISTRATION]: ['defaultTopic', 'validatorAddress'],
		[EVENT_NAME_BLS_KEY_REGISTRATION]: ['defaultTopic', 'validatorAddress'],
	},
	[MODULE_NAME_TOKEN]: {
		[EVENT_NAME_TRANSFER]: ['defaultTopic', 'senderAddress', 'recipientAddress'],
		[EVENT_NAME_TRANSFER_CROSS_CHAIN]: [
			'defaultTopic',
			'senderAddress',
			'recipientAddress',
			'receivingChainID',
		],
		[EVENT_NAME_CCM_TRANSFER]: ['transactionID', 'senderAddress', 'recipientAddress'],
		[EVENT_NAME_MINT]: ['defaultTopic', 'address'],
		[EVENT_NAME_BURN]: ['defaultTopic', 'address'],
		[EVENT_NAME_LOCK]: ['transactionID', 'address'],
		[EVENT_NAME_UNLOCK]: ['transactionID', 'address'],
		[EVENT_NAME_INITIALIZE_TOKEN]: ['defaultTopic', 'tokenID'],
		[EVENT_NAME_INITIALIZE_USER_ACCOUNT]: ['transactionID', 'userAccountAddress'],
		[EVENT_NAME_INITIALIZE_ESCROW_ACCOUNT]: ['defaultTopic', 'chainID'],
		[EVENT_NAME_RECOVER]: ['defaultTopic', 'address'],
		[EVENT_NAME_BEFORE_CCC_EXECUTION]: ['defaultTopic', 'relayerAddress', 'messageFeeTokenID'],
		[EVENT_NAME_BEFORE_CCM_FORWARDING]: ['defaultTopic', 'sendingChainID', 'receivingChainID'],
		[EVENT_NAME_ALL_TOKENS_SUPPORTED]: ['defaultTopic'],
		[EVENT_NAME_ALL_TOKENS_SUPPORT_REMOVED]: ['defaultTopic'],
		[EVENT_NAME_ALL_TOKENS_FROM_CHAIN_SUPPORTED]: ['defaultTopic', 'chainID'],
		[EVENT_NAME_ALL_TOKENS_FROM_CHAIN_SUPPORT_REMOVED]: ['defaultTopic', 'chainID'],
		[EVENT_NAME_TOKEN_ID_SUPPORTED]: ['defaultTopic', 'tokenID'],
		[EVENT_NAME_TOKEN_ID_SUPPORT_REMOVED]: ['defaultTopic', 'tokenID'],
	},
	[MODULE_NAME_FEE]: {
		[EVENT_NAME_FEE_PROCESSED]: ['transactionID', 'senderAddress', 'generatorAddress'],
		[EVENT_NAME_INSUFFICIENT_FEE]: ['transactionID'],
		[EVENT_NAME_RELAYER_FEE_PROCESSED]: ['ccmID', 'relayerAddress'],
	},
	[MODULE_NAME_INTEROPERABILITY]: {
		[EVENT_NAME_INVALID_CERTIFICATE_SIGNATURE]: ['transactionID', 'chainID'],
		[EVENT_NAME_INVALID_REGISTRATION_SIGNATURE]: ['transactionID', 'chainID'],
		[EVENT_NAME_CHAIN_ACCOUNT_UPDATED]: ['transactionID', 'sendingChainID'],
		[EVENT_NAME_CCM_SEND_SUCCESS]: [
			'transactionID',
			'sendingChainID',
			'receivingChainID',
			'sentCCMID',
		],
		[EVENT_NAME_CCM_SENT_FAILED]: ['transactionID'],
		[EVENT_NAME_CCM_PROCESSED]: ['transactionID', 'sendingChainID', 'receivingChainID'],
		[EVENT_NAME_TERMINATED_STATE_CREATED]: ['transactionID', 'chainID'],
		[EVENT_NAME_TERMINATED_OUTBOX_CREATED]: ['transactionID', 'chainID'],
	},
	[MODULE_NAME_POS]: {
		[EVENT_NAME_VALIDATOR_REGISTERED]: ['transactionID', 'validatorAddress'],
		[EVENT_NAME_VALIDATOR_STAKED]: ['transactionID', 'stakerAddress', 'validatorAddress'],
		[EVENT_NAME_VALIDATOR_PUNISHED]: ['transactionID', 'validatorAddress'],
		[EVENT_NAME_VALIDATOR_BANNED]: ['transactionID', 'validatorAddress'],
		[EVENT_NAME_COMMISSION_CHANGE]: ['transactionID', 'validatorAddress'],
		[EVENT_NAME_REWARDS_ASSIGNED]: ['transactionID', 'stakerAddress'],
	},
	[MODULE_NAME_RANDOM]: {
		// No events defined in LIP
	},
	[MODULE_NAME_BLOCK_REWARDS]: {
		[EVENT_NAME_REWARD_MINTED]: ['defaultTopic', 'generatorAddress'],
	},
	[MODULE_NAME_DYNAMIC_BLOCK_REWARDS]: {
		[EVENT_NAME_REWARD_MINTED]: ['defaultTopic', 'generatorAddress'],
	},
	[MODULE_NAME_LEGACY]: {
		[EVENT_NAME_ACCOUNT_RECLAIMED]: ['transactionID', 'legacyAddress', 'newAddress'],
		[EVENT_NAME_KEYS_REGISTERED]: ['transactionID', 'validatorAddress', 'generatorKey', 'blsKey'],
	},
};

module.exports = {
	EVENT_TOPIC_MAPPINGS_BY_MODULE,
	COMMAND_EXECUTION_RESULT_TOPICS,
};
