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
const path = require('path');
const _ = require('lodash');

const {
	Utils: {
		fs: { exists, mkdir, rmdir, write },
	},
	DB: {
		MySQL: {
			KVStore: { configureKeyValueTable, getKeyValueTable },
		},
	},
} = require('klayr-service-framework');

const { appMetaObj, tokenMetaObj } = require('../../../constants/metadataIndex');

const config = require('../../../../config');

const MYSQL_ENDPOINT = config.endpoints.mysql;
configureKeyValueTable(MYSQL_ENDPOINT);

const tempDir = `${__dirname}/temp/${appMetaObj.networkType}/${appMetaObj.chainName}`;
const appMetaPath = `${tempDir}/${config.FILENAME.APP_JSON}`;
const tokenMetaPath = `${tempDir}/${config.FILENAME.NATIVETOKENS_JSON}`;

const {
	getRepoDownloadURL,
	getLatestCommitHash,
	getCommitInfo,
	getFileDownloadURLAndHeaders,
	getDiff,
	buildEventPayload,
	syncWithRemoteRepo,
	downloadRepositoryToFS,
	getRepoInfoFromURL,
} = require('../../../../shared/utils/downloadRepository');

const { KV_STORE_KEY } = require('../../../../shared/constants');

const getKeyValueTableInstance = () => getKeyValueTable(MYSQL_ENDPOINT);

const commitHashRegex = /^[a-f0-9]{40}$/;
const enevtiAppFilePath = path.resolve(`${config.dataDir}/app-registry/devnet/Enevti/app.json`);

beforeAll(async () => {
	// Create metadata files in a temporary directory
	await mkdir(tempDir);
	await write(appMetaPath, JSON.stringify(appMetaObj));
	await write(tokenMetaPath, JSON.stringify(tokenMetaObj));
});

afterAll(async () => rmdir(tempDir));

describe('Test getLatestCommitHash method', () => {
	it('should return correct latest commit hash info', async () => {
		const response = await getLatestCommitHash();
		expect(typeof response).toEqual('string');
		expect(response).toMatch(commitHashRegex);
	});
});

xdescribe('Test getCommitInfo method', () => {
	const lastSyncedCommitHash = 'ec938b74bcb8208c95d8e4edc8c8a0961d1aaaaa';
	beforeAll(async () => {
		const keyValueTable = await getKeyValueTableInstance();

		keyValueTable.set(KV_STORE_KEY.COMMIT_HASH_UNTIL_LAST_SYNC, lastSyncedCommitHash);
	});
	afterAll(async () => {
		const keyValueTable = await getKeyValueTableInstance();
		keyValueTable.delete(KV_STORE_KEY.COMMIT_HASH_UNTIL_LAST_SYNC);
	});

	it('should return correct commit info', async () => {
		const response = await getCommitInfo();
		expect(Object.keys(response)).toEqual(['lastSyncedCommitHash', 'latestCommitHash']);
		expect(response.lastSyncedCommitHash).toEqual(lastSyncedCommitHash);
		expect(response.latestCommitHash).toMatch(commitHashRegex);
	});
});

xdescribe('Test getRepoDownloadURL method', () => {
	it('should return correct repository download url info', async () => {
		/* eslint-disable-next-line no-useless-escape */
		const repoUrlRegex =
			/^https:\/\/\w*\.github\.com\/klayrhq\/app-registry\/legacy.tar.gz\/refs\/heads\/main(?:\?token=\w+)?$/;
		const response = await getRepoDownloadURL();
		expect(response.url).toMatch(repoUrlRegex);
	});
});

xdescribe('Test getFileDownloadURLAndHeaders method', () => {
	it('should return correct file download info when file is valid', async () => {
		const { owner, repo } = getRepoInfoFromURL(config.gitHub.appRegistryRepo);
		const fileName = 'devnet/Enevti/app.json';
		/* eslint-disable-next-line no-useless-escape */
		const ownerSafe = _.escapeRegExp(owner);
		const repoSafe = _.escapeRegExp(repo);
		const branchSafe = _.escapeRegExp(config.gitHub.branch);
		const fileNameSafe = _.escapeRegExp(fileName);
		const fileUrl = `https://api.github.com/repos/${ownerSafe}/${repoSafe}/contents/${fileNameSafe}?ref=${branchSafe}`;

		const response = await getFileDownloadURLAndHeaders(fileName);
		expect(response.url).toEqual(fileUrl);
	});

	it('should throw error when file is invalid', async () => {
		expect(async () =>
			getFileDownloadURLAndHeaders('devnet/Enevti/invalid_file'),
		).rejects.toThrow();
	});

	it('should throw error when file is undefined', async () => {
		expect(async () => getFileDownloadURLAndHeaders(undefined)).rejects.toThrow();
	});

	it('should throw error when file is null', async () => {
		expect(async () => getFileDownloadURLAndHeaders(null)).rejects.toThrow();
	});
});

xdescribe('Test getDiff method', () => {
	it('should return list of file differences between two commits when commits are valid', async () => {
		const response = await getDiff(
			'838464896420410dcbade293980fe42ca95931d0',
			'5ca021f84cdcdb3b28d3766cf675d942887327c3',
		);
		const fileNames = response.data.files.map(file => file.filename);
		expect(fileNames).toEqual([
			'alphanet/Klayr/nativetokens.json',
			'betanet/Klayr/nativetokens.json',
			'devnet/Klayr/nativetokens.json',
		]);
	});

	it('should throw error when both commits are invalid', async () => {
		expect(() =>
			getDiff(
				'aaaa64896420410dcbade293980fe42ca95931d0',
				'bbbb21f84cdcdb3b28d3766cf675d942887327c3',
			),
		).rejects.toThrow();
	});

	it('should throw error when lastSyncedCommitHash is invalid', async () => {
		expect(() =>
			getDiff(
				'aaaa64896420410dcbade293980fe42ca95931d0',
				'5ca021f84cdcdb3b28d3766cf675d942887327c3',
			),
		).rejects.toThrow();
	});

	it('should throw error when both latestCommitHash is invalid', async () => {
		expect(() =>
			getDiff(
				'838464896420410dcbade293980fe42ca95931d0',
				'bbbb21f84cdcdb3b28d3766cf675d942887327c3',
			),
		).rejects.toThrow();
	});

	it('should throw error when one or both commits are undefined', async () => {
		expect(() => getDiff('838464896420410dcbade293980fe42ca95931d0', undefined)).rejects.toThrow();
		expect(() => getDiff(undefined, '5ca021f84cdcdb3b28d3766cf675d942887327c3')).rejects.toThrow();
		expect(() => getDiff(undefined, undefined)).rejects.toThrow();
	});

	it('should throw error when one or both commits are null', async () => {
		expect(() => getDiff('838464896420410dcbade293980fe42ca95931d0', null)).rejects.toThrow();
		expect(() => getDiff(null, '5ca021f84cdcdb3b28d3766cf675d942887327c3')).rejects.toThrow();
		expect(() => getDiff(null, null)).rejects.toThrow();
	});
});

xdescribe('Test buildEventPayload method', () => {
	it('should return event payload when called with a list of changed files', async () => {
		const changedFiles = [
			'betanet/Klayr/nativetokens.json',
			'devnet/Klayr/nativetokens.json',
			'Unknown/Klayr/nativetokens.json',
		];
		const response = await buildEventPayload(changedFiles);
		expect(response).toEqual({
			betanet: ['klayr_mainchain'],
			devnet: ['klayr_mainchain'],
			mainnet: [],
			testnet: [],
		});
	});

	it('should return event payload when called with empty changed files', async () => {
		const response = await buildEventPayload([]);
		expect(response).toEqual({
			betanet: [],
			devnet: [],
			mainnet: [],
			testnet: [],
		});
	});

	it('should return event payload when called with undefined changed files', async () => {
		const response = await buildEventPayload(undefined);
		expect(response).toEqual({
			betanet: [],
			devnet: [],
			mainnet: [],
			testnet: [],
		});
	});

	it('should return event payload when called with null changed files', async () => {
		const response = await buildEventPayload(null);
		expect(response).toEqual({
			betanet: [],
			devnet: [],
			mainnet: [],
			testnet: [],
		});
	});
});

xdescribe('Test downloadRepositoryToFS method', () => {
	it('should download repository correctly for first time', async () => {
		await rmdir(config.dataDir);
		expect(await exists(enevtiAppFilePath)).toEqual(false);
		await downloadRepositoryToFS();
		expect(await exists(enevtiAppFilePath)).toEqual(true);
	});

	xit('should update repository correctly when repository is already downloaded before', async () => {
		const lastSyncedCommitHash = 'dc94ddae2aa3a9534a760e9e1c0425b6dcda38e8';

		const keyValueTable = await getKeyValueTableInstance();

		await rmdir(enevtiAppFilePath);
		expect(await exists(enevtiAppFilePath)).toEqual(false);
		await keyValueTable.set(KV_STORE_KEY.COMMIT_HASH_UNTIL_LAST_SYNC, lastSyncedCommitHash);
		await downloadRepositoryToFS();
		expect(await exists(enevtiAppFilePath)).toEqual(true);
		await keyValueTable.delete(KV_STORE_KEY.COMMIT_HASH_UNTIL_LAST_SYNC);
	});
});

xdescribe('Test syncWithRemoteRepo method', () => {
	const lastSyncedCommitHash = 'dc94ddae2aa3a9534a760e9e1c0425b6dcda38e8';
	beforeAll(async () => {
		// Set last sync commit hash in db and remove existing file
		const keyValueTable = await getKeyValueTableInstance();

		await keyValueTable.set(KV_STORE_KEY.COMMIT_HASH_UNTIL_LAST_SYNC, lastSyncedCommitHash);
		await rmdir(enevtiAppFilePath);
	});
	afterAll(async () => {
		const keyValueTable = await getKeyValueTableInstance();
		keyValueTable.delete(KV_STORE_KEY.COMMIT_HASH_UNTIL_LAST_SYNC);
	});

	it('should sync repository upto latest commit', async () => {
		expect(await exists(enevtiAppFilePath)).toEqual(false);
		await syncWithRemoteRepo();
		expect(await exists(enevtiAppFilePath)).toEqual(true);
	});
});
