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
const path = require('path');
const { Signals, Microservice, Logger, LoggerConfig } = require('klayr-service-framework');

const config = require('./config');

LoggerConfig(config.log);

const packageJson = require('./package.json');
const nodeStatus = require('./shared/nodeStatus');
const { init } = require('./shared/sdk');

const logger = Logger();

const app = Microservice({
	name: 'connector',
	transporter: config.transporter,
	brokerTimeout: config.brokerTimeout, // in seconds
	logger: config.log,
	events: {
		'update.index.status': async payload => {
			logger.debug("Received a 'update.index.status' moleculer event from indexer.");
			Signals.get('updateIndexStatus').dispatch(payload);
		},
	},
});

nodeStatus.waitForNode().then(async () => {
	logger.info(`Found a node, starting service ${packageJson.name.toUpperCase()}...`);

	nodeStatus.waitForNodeToFinishSync().then(async () => {
		// Add routes, events & jobs
		app.addMethods(path.join(__dirname, 'methods'));

		const allBlockchainEndpoints = await require('./methods/proxy/allEndpoints');
		allBlockchainEndpoints.forEach(method => app.addMethod(method));

		app.addEvents(path.join(__dirname, 'events'));
		const allBlockchainEvents = await require('./events/proxy/allEvents');
		allBlockchainEvents.forEach(event => app.addEvent(event));

		app.addJobs(path.join(__dirname, 'jobs'));

		if (config.enableTestingMode) {
			app.addMethods(path.join(__dirname, 'methods', 'tests'));
		}

		app
			.run()
			.then(async () => {
				await init();
			})
			.catch(err => {
				logger.fatal(`Failed to start service ${packageJson.name} due to: ${err.message}`);
				logger.fatal(err.stack);
				process.exit(1);
			});
	});
});
