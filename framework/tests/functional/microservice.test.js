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
const Microservice = require('../../src/microservice');
const LoggerConfig = require('../../src/logger').init;

const loggerConf = {
	console: 'true',
	level: 'debug',
	name: 'test-service',
};

LoggerConfig(loggerConf);

const app = Microservice({
	name: 'test-service',
	transporter: process.env.REDIS_URL || 'redis://klayr:password@127.0.0.1:6379/0',
	logger: loggerConf,
});

const testJob = () => true;

describe('Test microservice', () => {
	describe('scheduleJob()', () => {
		it('should occur only during start', async () => {
			const job = {
				name: 'test.job.start',
				description: 'Return true',
				init: () => testJob(),
			};
			expect(app.scheduleJob(job)).resolves.toBe(true);
		});

		it('should occur based on interval', async () => {
			const job = {
				name: 'test.job.start',
				description: 'Return true',
				interval: 5, // seconds
				init: () => testJob(),
				controller: () => testJob(),
			};
			expect(app.scheduleJob(job)).resolves.toBe(true);
		});

		it('should occur based on cron', async () => {
			const job = {
				name: 'test.job.start',
				description: 'Return true',
				schedule: '* * * * *',
				init: () => testJob(),
				controller: () => testJob(),
			};
			expect(app.scheduleJob(job)).resolves.toBe(true);
		});

		it('should return false when no init or controller defined', async () => {
			const job = {
				name: 'test.job.start',
				description: 'Return true',
				schedule: '* * * * *',
			};
			expect(app.scheduleJob(job)).resolves.toBe(false);
		});

		it('should return false when no schedule or interval defined with controller', async () => {
			const job = {
				name: 'test.job.start',
				description: 'Return true',
				init: () => testJob(),
				controller: () => testJob(),
			};
			expect(app.scheduleJob(job)).resolves.toBe(false);
		});

		it('should return false when no controller defined with interval/schedule', async () => {
			const job = {
				name: 'test.job.start',
				description: 'Return true',
				interval: 5, // seconds
				init: () => testJob(),
			};
			expect(app.scheduleJob(job)).resolves.toBe(false);
		});
	});

	describe('addMethods()', () => {
		it('should return true when method is registered', async () => {
			const testMethod = {
				name: 'test.method',
				description: 'Return true',
				controller: async () => true,
			};
			expect(app.addMethod(testMethod)).toBe(true);
		});

		it('should return false when no controller defined', async () => {
			const testMethod = {
				name: 'test.method',
				description: 'Return false',
			};
			expect(app.addMethod(testMethod)).toBe(false);
		});
	});

	describe('addEvents()', () => {
		it('should return true when event is registered', async () => {
			const testEvent = {
				name: 'test.event',
				description: 'Return true',
				controller: async () => true,
			};
			expect(app.addEvent(testEvent)).toBe(true);
		});

		it('should return false when no controller defined', async () => {
			const testEvent = {
				name: 'test.event',
				description: 'Return false',
			};
			expect(app.addEvent(testEvent)).toBe(false);
		});
	});

	describe('requestRpc()', () => {
		it('should return result when called with registered method name', async () => {
			const testData = {
				address: 'klydwsyfmcko6mcd357446yatromr9vzgu7eb8y99',
				balance: '95589969000000',
			};

			const testFunc = async () => testData;

			const testMethod = {
				name: 'registered.method',
				description: 'Return data',
				controller: testFunc,
			};

			app.addMethod(testMethod);
			await app.run();

			const result = await app.requestRpc('test-service.registered.method', {});
			expect(result).toMatchObject(testData);
		});

		it('should throw an error when method is not registered', async () => {
			expect(() => app.requestRpc('test-service.unregistered.method', {})).rejects.toThrow();
		});
	});
});
