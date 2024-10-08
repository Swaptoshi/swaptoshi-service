/*
 * LiskHQ/lisk-service
 * Copyright © 2020 Lisk Foundation
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
const path = require('path');
const { Microservice, Logger, LoggerConfig, Libs } = require('klayr-service-framework');

const config = require('./config');

LoggerConfig(config.log);

const SocketIOService = require('./shared/moleculer-io');

const ApiService = Libs['moleculer-web'];
const { methods } = require('./shared/moleculer-web/methods');

const { getHttpRoutes } = require('./routes');
const { getSocketNamespaces } = require('./namespaces');
const packageJson = require('./package.json');
const { getStatus } = require('./shared/status');
const { getReady, getIndexStatus } = require('./shared/ready');
const { genDocs } = require('./shared/generateDocs');
const { setAppContext } = require('./shared/appContext');

const { mapper } = require('./shared/customMapper');
const { definition: blocksDefinition } = require('./sources/version3/blocks');
const { definition: feesDefinition } = require('./sources/version3/fees');
const { definition: generatorsDefinition } = require('./sources/version3/generators');
const { definition: transactionsDefinition } = require('./sources/version3/transactions');
const { definition: indexStatusUpdateDefinition } = require('./sources/version3/indexStatus');
const { setLogo, deleteLogo } = require('./shared/logo');

const { host, port } = config;

const logger = Logger();

const MODULE = {
	DYNAMIC_REWARD: 'dynamicReward',
	REWARD: 'reward',
};

const defaultBrokerConfig = {
	name: 'gateway',
	transporter: config.transporter,
	brokerTimeout: config.brokerTimeout, // in seconds
	logger: config.log,
	dependencies: config.brokerDependencies,
};

// Use temporary service to fetch registered sdk modules
const tempApp = Microservice({
	...defaultBrokerConfig,
	name: 'temp_service_gateway',
	events: {},
});

tempApp.run().then(async () => {
	// Prepare routes
	const { modules: registeredModules } = await tempApp.requestRpc('connector.getSystemMetadata');
	const registeredModuleNames = registeredModules.map(module =>
		module.name === MODULE.REWARD ? MODULE.DYNAMIC_REWARD : module.name,
	);
	await tempApp.getBroker().stop();
	const httpRoutes = getHttpRoutes(registeredModuleNames);
	const socketNamespaces = getSocketNamespaces(registeredModuleNames);

	// Prepare gateway service
	const app = Microservice(defaultBrokerConfig);
	const broker = app.getBroker();

	const sendSocketIoEvent = (eventName, payload) => {
		broker.call('gateway.broadcast', {
			namespace: '/blockchain',
			event: eventName,
			args: [payload],
		});
	};

	const gatewayConfig = {
		transporter: config.transporter,
		mixins: [ApiService, SocketIOService],
		name: 'gateway',
		created() {
			if (config.rateLimit.numKnownProxies > 0 || config.api.isReverseProxyPresent) {
				// Ensure all inactive connections are terminated by the ALB,
				// by setting this a few seconds higher than the ALB idle timeout
				this.server.keepAliveTimeout = config.api.httpKeepAliveTimeout;
				// Ensure the headersTimeout is set higher than the keepAliveTimeout
				// due to this nodejs regression bug: https://github.com/nodejs/node/issues/27363
				this.server.headersTimeout = config.api.httpHeadersTimeout;
			}
		},
		actions: {
			'logo.save': {
				params: {
					fileName: { optional: false, type: 'string' },
					data: { optional: false, type: 'string' },
				},
				handler: ctx => setLogo(ctx.params),
			},
			'logo.delete': {
				params: {
					fileName: { optional: false, type: 'string' },
				},
				handler: ctx => deleteLogo(ctx.params),
			},
			ready() {
				return getReady();
			},
			async spec(ctx) {
				return genDocs(ctx, registeredModuleNames);
			},
			status() {
				return getStatus(this.broker);
			},
			isBlockchainIndexReady() {
				return getIndexStatus();
			},
		},
		settings: {
			host,
			port,
			path: '/api',
			etag: 'strong',
			use: [],

			cors: {
				origin: config.cors.allowedOrigin,
				methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE'],
				allowedHeaders: [
					'Content-Type',
					'Access-Control-Request-Method',
					'Access-Control-Request-Headers',
					'Access-Control-Max-Age',
				],
				exposedHeaders: [],
				credentials: false,
				maxAge: 3600,
			},

			// Used server instance. If null, it will create a new HTTP(s)(2) server
			// If false, it will start without server in middleware mode
			server: true,

			logRequestParams: 'debug',
			logResponseData: 'debug',
			logRequest: 'debug',
			enableHTTPRequest: false,
			log2XXResponses: 'debug',
			enable2XXResponses: false,
			httpServerTimeout: 30 * 1000, // ms
			optimizeOrder: true,
			routes: httpRoutes,

			assets: {
				folder: './public',
				options: {
					setHeaders: res => {
						res.setHeader('Access-Control-Allow-Origin', config.cors.allowedOrigin);
						res.setHeader(
							'Access-Control-Allow-Headers',
							'Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Max-Age',
						);
						res.setHeader('Pragma-directive', 'no-cache');
						res.setHeader('Cache-directive', 'no-cache');
						res.setHeader('Cache-control', 'no-cache');
						res.setHeader('Pragma', 'no-cache');
						res.setHeader('Expires', '0');
					},
				},
			},

			onError(req, res, err) {
				res.setHeader('Content-Type', 'application/json');
				res.writeHead(err.code || 500);
				res.end(
					JSON.stringify({
						error: true,
						message: `Server error: ${err.message}`,
					}),
				);
			},
			io: {
				namespaces: socketNamespaces,
			},
		},
		methods,
		events: {
			'block.new': payload => sendSocketIoEvent('new.block', mapper(payload, blocksDefinition)),
			'transactions.new': payload =>
				sendSocketIoEvent('new.transactions', mapper(payload, transactionsDefinition)),
			'block.delete': payload =>
				sendSocketIoEvent('delete.block', mapper(payload, blocksDefinition)),
			'transactions.delete': payload =>
				sendSocketIoEvent('delete.transactions', mapper(payload, transactionsDefinition)),
			'round.change': payload => sendSocketIoEvent('update.round', payload),
			'generators.change': payload =>
				sendSocketIoEvent('update.generators', mapper(payload, generatorsDefinition)),
			'update.fee_estimates': payload =>
				sendSocketIoEvent('update.fee_estimates', mapper(payload, feesDefinition)),
			'metadata.change': payload => sendSocketIoEvent('update.metadata', payload),
			'update.index.status': payload =>
				sendSocketIoEvent('update.index.status', mapper(payload, indexStatusUpdateDefinition)),
		},
		dependencies: config.brokerDependencies,
	};

	if (config.rateLimit.enable) {
		logger.info(
			`Enabling rate limiter, connLimit: ${config.rateLimit.connectionLimit}, window: ${config.rateLimit.window}.`,
		);

		gatewayConfig.settings.rateLimit = {
			window: (config.rateLimit.window || 10) * 1000,
			limit: config.rateLimit.connectionLimit || 200,
			headers: true,

			key: req => {
				if (config.rateLimit.enableXForwardedFor) {
					const xForwardedFor = req.headers['x-forwarded-for'];
					const { numKnownProxies } = config.rateLimit;

					if (xForwardedFor && numKnownProxies > 0) {
						const clientIPs = xForwardedFor.split(',').map(ip => ip.trim());
						const clientIndex = Math.max(clientIPs.length - numKnownProxies - 1, 0);

						return clientIPs[clientIndex];
					}
				}

				return (
					req.connection.remoteAddress ||
					req.socket.remoteAddress ||
					req.connection.socket.remoteAddress
				);
			},
		};
	}

	setAppContext(app);
	app.addJobs(path.join(__dirname, 'jobs'));

	// Run the application
	app
		.run(gatewayConfig)
		.then(() => {
			logger.info(`Started Gateway API on ${host}:${port}.`);
		})
		.catch(err => {
			logger.fatal(`Failed to start service ${packageJson.name} due to: ${err.message}`);
			logger.fatal(err.stack);
			process.exit(1);
		});
});
