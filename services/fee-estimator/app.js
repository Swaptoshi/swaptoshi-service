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
const { Microservice, Logger, LoggerConfig, Signals } = require('klayr-service-framework');

const config = require('./config');

LoggerConfig(config.log);

const packageJson = require('./package.json');
const { setAppContext } = require('./shared/utils/request');

const logger = Logger();

const app = Microservice({
	name: 'fees',
	transporter: config.transporter,
	brokerTimeout: config.brokerTimeout, // in seconds
	logger: config.log,
	events: {
		chainNewBlock: async payload => Signals.get('newBlock').dispatch(payload),
		chainDeleteBlock: async payload => Signals.get('deleteBlock').dispatch(payload),
	},
	dependencies: ['connector'],
});

setAppContext(app);

// Add routes, events & jobs
app.addMethods(path.join(__dirname, 'methods'));
app.addEvents(path.join(__dirname, 'events'));

// Run the application
app
	.run()
	.then(async () => {
		logger.info(`Service started ${packageJson.name}.`);
	})
	.catch(err => {
		logger.fatal(`Failed to start service ${packageJson.name} due to: ${err.message}`);
		logger.fatal(err.stack);
		process.exit(1);
	});
