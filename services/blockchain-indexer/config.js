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
const packageJson = require('./package.json');

const config = {
	dex: {},
	nftStorage: {},
	endpoints: {},
	job: {},
	log: {
		name: packageJson.name,
		version: packageJson.version,
	},
};

/**
 * DEX config
 */
config.dex.maxRouteLength = process.env.DEX_PRICE_INDEXING_MAX_ROUTE_LENGTH || 5;
config.dex.tickTimeframe = process.env.DEX_PRICE_INDEXING_TICK_TIMEFRAME || '5m';
config.dex.ohlcTimeframes = process.env.DEX_PRICE_INDEXING_OHLC_TIMEFRAMES || '1h,4h,1d,1w,1M';
config.dex.indexTokenConcurrency = process.env.DEX_INDEX_TOKEN_CONCURRENCY || 64;
config.dex.lastPriceInterval = process.env.DEX_LAST_PRICE_UPDATE_INTERVAL || '5m';

/**
 * NFT.Storage Config
 */
config.nftStorage.apiKey = process.env.NFT_STORAGE_API_KEY || '';

/**
 * Inter-service message broker
 */
config.transporter = process.env.SERVICE_BROKER || 'redis://klayr:password@127.0.0.1:6379/0';
config.brokerTimeout = Number(process.env.SERVICE_BROKER_TIMEOUT) || 10; // in seconds

/**
 * External endpoints
 */
config.endpoints.cache =
	process.env.SERVICE_INDEXER_CACHE_REDIS || 'redis://klayr:password@127.0.0.1:6379/2';
config.endpoints.volatileRedis =
	process.env.SERVICE_INDEXER_REDIS_VOLATILE || 'redis://klayr:password@127.0.0.1:6379/3';
config.endpoints.messageQueue =
	process.env.SERVICE_MESSAGE_QUEUE_REDIS || 'redis://klayr:password@127.0.0.1:6379/4';
// Primary database. Used for both read-write operations.
config.endpoints.mysql =
	process.env.SERVICE_INDEXER_MYSQL || 'mysql://klayr:password@127.0.0.1:3306/klayr';
// DB replicas against the primary. Used for read-only operations.
config.endpoints.mysqlReplica =
	process.env.SERVICE_INDEXER_MYSQL_READ_REPLICA || config.endpoints.mysql;
config.endpoints.mainchainServiceUrl = process.env.MAINCHAIN_SERVICE_URL; // For custom deployments
config.serviceUrl = process.env.SERVICE_URL || 'https://service.swaptoshi.com';
config.endpoints.klayrStatic = process.env.KLAYR_STATIC || 'https://static-data.klayr.xyz';

/**
 * LOGGING
 *
 * log.level   - TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK
 * log.console - Plain JavaScript console.log() output (true/false)
 * log.stdout  - Writes directly to stdout (true/false)
 * log.file    - outputs to a file (ie. ./logs/app.log)
 * log.gelf    - Writes to GELF-compatible socket (ie. 127.0.0.1:12201/udp)
 */
config.log.level = process.env.SERVICE_LOG_LEVEL || 'info';
config.log.console = process.env.SERVICE_LOG_CONSOLE || 'false';
config.log.stdout = process.env.SERVICE_LOG_STDOUT || 'true';
config.log.gelf = process.env.SERVICE_LOG_GELF || 'false';
config.log.file = process.env.SERVICE_LOG_FILE || 'false';
config.log.docker_host = process.env.DOCKER_HOST || 'local';
config.debug = process.env.SERVICE_LOG_LEVEL === 'debug';

/**
 * Message queue options
 */
config.queue = {
	defaultJobOptions: {
		attempts: 5,
		timeout: 5 * 60 * 1000, // millisecs
		removeOnComplete: true,
		removeOnFail: true,
		stackTraceLimit: 0,
	},

	// Inter-microservice message queues
	account: { name: 'Account' },
	block: { name: 'Block' },
	event: { name: 'Event' },

	// Intra-microservice job queues
	accountQueueByAddress: {
		name: 'AccountQueueByAddress',
		concurrency: 1,
	},
	accountQueueDirect: {
		name: 'AccountQueueDirect',
		concurrency: 1,
	},
	accountQueueByPublicKey: {
		name: 'AccountQueueByPublicKey',
		concurrency: 1,
	},
	deleteIndexedBlocks: {
		name: 'DeleteIndexedBlocks',
		concurrency: 1,
	},
	indexBlocks: {
		name: 'IndexBlocks',
		concurrency: 1,
		scheduledJobsMaxCount: Number(process.env.INDEX_BLOCKS_QUEUE_SCHEDULED_JOB_MAX_COUNT) || 100000,
	},
	indexAccountPublicKey: {
		name: 'PendingPublickeyUpdates',
		concurrency: 512,
	},
	indexAccountAddress: {
		name: 'PendingAddressUpdates',
		concurrency: 512,
	},
	indexPreviousKLYUSDTickPrice: {
		name: 'IndexPreviousKLYUSDTickPrice',
		concurrency: 8,
	},
	indexPreviousKLYUSDOhlcPrice: {
		name: 'IndexPreviousKLYUSDOhlcPrice',
		concurrency: 8,
	},
	indexCurrentKLYUSDPrice: {
		name: 'IndexCurrentKLYUSDPrice',
		concurrency: 1,
	},
	nftStorageUpload: {
		name: 'NFTStorageUpload',
		concurrency: 8,
	},
	nftStorageDelete: {
		name: 'NFTStorageDelete',
		concurrency: 8,
	},
};

config.set = {
	accountBalanceUpdate: {
		name: 'AccountBalanceUpdate',
		batchSize: Number(process.env.ACCOUNT_BALANCE_UPDATE_BATCH_SIZE) || 1000,
	},
};

config.operations = {
	isDataRetrievalModeEnabled: Boolean(
		String(process.env.ENABLE_DATA_RETRIEVAL_MODE).toLowerCase() !== 'false',
	), // Enabled by default
	isIndexingModeEnabled: Boolean(
		String(process.env.ENABLE_INDEXING_MODE).toLowerCase() !== 'false',
	), // Enabled by default
};

config.networks = Object.freeze({
	KLAYR: [
		{
			name: 'mainnet',
			chainID: '00000000',
			serviceURL: 'https://service.klayr.xyz',
			snapshotURL: 'https://snapshots.klayr.xyz/mainnet/service.sql.gz',
		},
		{
			name: 'testnet',
			chainID: '01000000',
			serviceURL: 'https://testnet-service.klayr.xyz',
			snapshotURL: 'https://snapshots.klayr.xyz/testnet/service.sql.gz',
		},
		{
			name: 'betanet',
			chainID: '02000000',
			serviceURL: 'https://betanet-service.klayr.xyz',
			snapshotURL: 'https://snapshots.klayr.xyz/betanet/service.sql.gz',
		},
		{
			name: 'devnet',
			chainID: '04000000',
			serviceURL: process.env.DEVNET_MAINCHAIN_URL || 'http://devnet-service.klayrdev.net:9901',
		},
	],
});

config.db = {
	isPersistEvents: String(process.env.ENABLE_PERSIST_EVENTS).toLowerCase() === 'true',
	durabilityVerifyFrequency: Number(process.env.DURABILITY_VERIFY_FREQUENCY) || 1, // In millisecs
};

config.snapshot = {
	enable: String(process.env.ENABLE_APPLY_SNAPSHOT).toLowerCase() === 'true', // Disabled by default
	url: process.env.INDEX_SNAPSHOT_URL,
	allowInsecureHttp:
		String(process.env.ENABLE_SNAPSHOT_ALLOW_INSECURE_HTTP).toLowerCase() === 'true', // Disabled by default
};

config.job = {
	// Interval takes priority over schedule and must be greater than 0 to be valid
	deleteSerializedEvents: {
		interval: Number(process.env.JOB_INTERVAL_DELETE_SERIALIZED_EVENTS) || 0,
		schedule: process.env.JOB_SCHEDULE_DELETE_SERIALIZED_EVENTS || '*/5 * * * *',
	},
	refreshValidators: {
		interval: Number(process.env.JOB_INTERVAL_REFRESH_VALIDATORS) || 0,
		schedule: process.env.JOB_SCHEDULE_REFRESH_VALIDATORS || '*/5 * * * *',
	},
	validateValidatorsRank: {
		interval: Number(process.env.JOB_INTERVAL_VALIDATE_VALIDATORS_RANK) || 0,
		schedule: process.env.JOB_SCHEDULE_VALIDATE_VALIDATORS_RANK || '4-59/15 * * * *',
	},
	refreshLiveIndexingJobCount: {
		interval: Number(process.env.JOB_INTERVAL_REFRESH_INDEX_STATUS) || 10,
		schedule: process.env.JOB_SCHEDULE_REFRESH_INDEX_STATUS || '',
	},
	refreshBlockchainAppsStats: {
		interval: Number(process.env.JOB_INTERVAL_REFRESH_BLOCKCHAIN_APPS_STATS) || 0,
		schedule: process.env.JOB_SCHEDULE_REFRESH_BLOCKCHAIN_APPS_STATS || '*/15 * * * *',
	},
	refreshAccountsKnowledge: {
		interval: Number(process.env.JOB_INTERVAL_REFRESH_ACCOUNT_KNOWLEDGE) || 0,
		schedule: process.env.JOB_SCHEDULE_REFRESH_ACCOUNT_KNOWLEDGE || '*/15 * * * *',
	},
	deleteFinalizedCCUMetadata: {
		interval: Number(process.env.JOB_INTERVAL_DELETE_FINALIZED_CCU_METADATA) || 0,
		schedule: process.env.JOB_SCHEDULE_DELETE_FINALIZED_CCU_METADATA || '0 2 * * *',
	},
	triggerAccountUpdates: {
		interval: Number(process.env.JOB_INTERVAL_TRIGGER_ACCOUNT_UPDATES) || 0,
		schedule: process.env.JOB_SCHEDULE_TRIGGER_ACCOUNT_UPDATES || '*/15 * * * *',
	},
	triggerAccountBalanceUpdates: {
		interval: Number(process.env.JOB_INTERVAL_TRIGGER_ACCOUNT_BALANCE_UPDATES) || 10,
		schedule: process.env.JOB_SCHEDULE_TRIGGER_ACCOUNT_BALANCE_UPDATES || '',
	},
};

config.estimateFees = {
	bufferBytesLength: Number(process.env.ESTIMATES_BUFFER_BYTES_LENGTH) || 0,
};

config.invokeAllowedMethods = process.env.INVOKE_ALLOWED_METHODS
	? String(process.env.INVOKE_ALLOWED_METHODS).split(',')
	: [
			'dynamicReward_getExpectedValidatorRewards',
			'token_hasUserAccount',
			'token_getInitializationFees',
			'interoperability_getMinimumMessageFee',
			'txpool_getTransactionsFromPool',
			'pos_getExpectedSharedRewards',
			'dex',
			'tokenFactory',
	  ];

module.exports = config;
