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
// Generic
const EVENT_NAME_COMMAND_EXECUTION_RESULT = 'commandExecutionResult';

// Auth
const MODULE_NAME_AUTH = 'auth';
const EVENT_NAME_MULTISIGNATURE_REGISTERED = 'multisignatureRegistration';
const EVENT_NAME_INVALID_SIGNATURE = 'invalidSignature';

// Validators
const MODULE_NAME_VALIDATORS = 'validators';
const EVENT_NAME_GENERATOR_KEY_REGISTRATION = 'generatorKeyRegistration';
const EVENT_NAME_BLS_KEY_REGISTRATION = 'blsKeyRegistration';

// Token
const MODULE_NAME_TOKEN = 'token';
const EVENT_NAME_TRANSFER = 'transfer';
const EVENT_NAME_TRANSFER_CROSS_CHAIN = 'transferCrossChain';
const EVENT_NAME_CCM_TRANSFER = 'ccmTransfer';
const EVENT_NAME_MINT = 'mint';
const EVENT_NAME_BURN = 'burn';
const EVENT_NAME_LOCK = 'lock';
const EVENT_NAME_UNLOCK = 'unlock';
const EVENT_NAME_INITIALIZE_TOKEN = 'initializeToken';
const EVENT_NAME_INITIALIZE_USER_ACCOUNT = 'initializeUserAccount';
const EVENT_NAME_INITIALIZE_ESCROW_ACCOUNT = 'initializeEscrowAccount';
const EVENT_NAME_RECOVER = 'recover';
const EVENT_NAME_BEFORE_CCC_EXECUTION = 'beforeCCCExecution';
const EVENT_NAME_BEFORE_CCM_FORWARDING = 'beforeCCMForwarding';
const EVENT_NAME_ALL_TOKENS_SUPPORTED = 'allTokensSupported';
const EVENT_NAME_ALL_TOKENS_SUPPORT_REMOVED = 'allTokensSupportRemoved';
const EVENT_NAME_ALL_TOKENS_FROM_CHAIN_SUPPORTED = 'allTokensFromChainSupported';
const EVENT_NAME_ALL_TOKENS_FROM_CHAIN_SUPPORT_REMOVED = 'allTokensFromChainSupportRemoved';
const EVENT_NAME_TOKEN_ID_SUPPORTED = 'tokenIDSupported';
const EVENT_NAME_TOKEN_ID_SUPPORT_REMOVED = 'tokenIDSupportRemoved';

// Fee
const MODULE_NAME_FEE = 'fee';
const EVENT_NAME_FEE_PROCESSED = 'generatorFeeProcessed';
const EVENT_NAME_INSUFFICIENT_FEE = 'insufficientFee';
const EVENT_NAME_RELAYER_FEE_PROCESSED = 'relayerFeeProcessed';

// Interoperability
const MODULE_NAME_INTEROPERABILITY = 'interoperability';
const EVENT_NAME_INVALID_CERTIFICATE_SIGNATURE = 'invalidCertificateSignature';
const EVENT_NAME_INVALID_REGISTRATION_SIGNATURE = 'invalidRegistrationSignature';
const EVENT_NAME_CHAIN_ACCOUNT_UPDATED = 'chainAccountUpdated';
const EVENT_NAME_CCM_SEND_SUCCESS = 'ccmSendSuccess';
const EVENT_NAME_CCM_SENT_FAILED = 'ccmSentFailed';
const EVENT_NAME_CCM_PROCESSED = 'ccmProcessed';
const EVENT_NAME_TERMINATED_STATE_CREATED = 'terminatedStateCreated';
const EVENT_NAME_TERMINATED_OUTBOX_CREATED = 'terminatedOutboxCreated';

// PoS
const MODULE_NAME_POS = 'pos';
const EVENT_NAME_VALIDATOR_REGISTERED = 'validatorRegistered';
const EVENT_NAME_VALIDATOR_STAKED = 'validatorStaked';
const EVENT_NAME_VALIDATOR_PUNISHED = 'validatorPunished';
const EVENT_NAME_VALIDATOR_BANNED = 'validatorBanned';
const EVENT_NAME_COMMISSION_CHANGE = 'commissionChange';
const EVENT_NAME_REWARDS_ASSIGNED = 'rewardsAssigned';

// Random
const MODULE_NAME_RANDOM = 'random';

// (Dynamic) Block Rewards
const MODULE_NAME_BLOCK_REWARDS = 'reward';
const MODULE_NAME_DYNAMIC_BLOCK_REWARDS = 'dynamicReward';
const EVENT_NAME_REWARD_MINTED = 'rewardMinted';

// Legacy
const MODULE_NAME_LEGACY = 'legacy';
const EVENT_NAME_ACCOUNT_RECLAIMED = 'accountReclaimed';
const EVENT_NAME_KEYS_REGISTERED = 'keysRegistered';

// Dex
const MODULE_NAME_DEX = 'dex';
const EVENT_NAME_POOL_CREATED = 'poolCreated';
const EVENT_NAME_TREASURIFY = 'treasurify';
const EVENT_NAME_INCREASE_OBSERVATION_CARDINALITY_NEXT = 'increaseObservationCardinalityNext';
const EVENT_NAME_POOL_INITIALIZED = 'poolInitialized';
const EVENT_NAME_DEX_MINT = 'mint';
const EVENT_NAME_COLLECT = 'collect';
const EVENT_NAME_DEX_BURN = 'burn';
const EVENT_NAME_COLLECT_PROTOCOL = 'collectProtocol';
const EVENT_NAME_SWAP = 'swap';
const EVENT_NAME_FLASH = 'flash';
const EVENT_NAME_INCREASE_LIQUIDITY = 'increaseLiquidity';
const EVENT_NAME_DECREASE_LIQUIDITY = 'decreaseLiquidity';
const EVENT_NAME_TOKEN_URI_CREATED = 'tokenURICreated';
const EVENT_NAME_COLLECT_POSITION = 'collectPosition';
const EVENT_NAME_TOKEN_URI_DESTROYED = 'tokenURIDestroyed';
const EVENT_NAME_TOKEN_REGISTERED = 'tokenRegistered';

// NFT
const MODULE_NAME_NFT = 'nft';
const EVENT_NAME_NFT_TRANSFER = 'transfer';
const EVENT_NAME_NFT_CREATE = 'create';
const EVENT_NAME_NFT_SET_ATTRIBUTE = 'setAttributes';

// Token Factory
const MODULE_NAME_TOKEN_FACTORY = 'tokenFactory';
const EVENT_NAME_AIRDROP_CREATED = 'airdropCreated';
const EVENT_NAME_AIRDROP_DISTRIBUTED = 'airdropDistributed';
const EVENT_NAME_AIRDROP_RECIPIENTS_CHANGED = 'airdropRecipientsChanged';
const EVENT_NAME_TOKEN_FACTORY_CREATED = 'factoryCreated';
const EVENT_NAME_TOKEN_FACTORY_SET_ATTRIBUTES = 'factorySetAttributes';
const EVENT_NAME_TOKEN_FACTORY_OWNER_CHANGED = 'factoryOwnerChanged';
const EVENT_NAME_ICO_CREATED = 'icoCreated';
const EVENT_NAME_ICO_DEPOSIT = 'icoDeposit';
const EVENT_NAME_ICO_PRICE_CHANGED = 'icoPriceChanged';
const EVENT_NAME_ICO_SWAP = 'icoSwap';
const EVENT_NAME_ICO_TREASURIFY = 'icoTreasurify';
const EVENT_NAME_ICO_WITHDRAW = 'icoWithdraw';
const EVENT_NAME_VESTED_TOKEN_LOCKED = 'vestedTokenLocked';
const EVENT_NAME_VESTED_TOKEN_UNLOCKED = 'vestedTokenUnlocked';

// Fee Conversion
const MODULE_NAME_FEE_CONVERSION = 'feeConversion';
const EVENT_NAME_FEE_CONVERTED = 'feeConverted';

// Liquid POS
const MODULE_NAME_LIQUID_POS = 'liquidPos';
const EVENT_NAME_LST_MINT = 'liquidStakingTokenMint';
const EVENT_NAME_LST_BURN = 'liquidStakingTokenBurn';

module.exports = {
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

	MODULE_NAME_TOKEN_FACTORY,
	EVENT_NAME_AIRDROP_CREATED,
	EVENT_NAME_AIRDROP_DISTRIBUTED,
	EVENT_NAME_AIRDROP_RECIPIENTS_CHANGED,
	EVENT_NAME_TOKEN_FACTORY_CREATED,
	EVENT_NAME_TOKEN_FACTORY_SET_ATTRIBUTES,
	EVENT_NAME_TOKEN_FACTORY_OWNER_CHANGED,
	EVENT_NAME_ICO_CREATED,
	EVENT_NAME_ICO_DEPOSIT,
	EVENT_NAME_ICO_PRICE_CHANGED,
	EVENT_NAME_ICO_SWAP,
	EVENT_NAME_ICO_TREASURIFY,
	EVENT_NAME_ICO_WITHDRAW,
	EVENT_NAME_VESTED_TOKEN_LOCKED,
	EVENT_NAME_VESTED_TOKEN_UNLOCKED,

	MODULE_NAME_FEE_CONVERSION,
	EVENT_NAME_FEE_CONVERTED,

	MODULE_NAME_LIQUID_POS,
	EVENT_NAME_LST_MINT,
	EVENT_NAME_LST_BURN,

	MODULE_NAME_NFT,
	EVENT_NAME_NFT_TRANSFER,
	EVENT_NAME_NFT_CREATE,
	EVENT_NAME_NFT_SET_ATTRIBUTE,

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
	EVENT_NAME_COMMAND_EXECUTION_RESULT,

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
};
