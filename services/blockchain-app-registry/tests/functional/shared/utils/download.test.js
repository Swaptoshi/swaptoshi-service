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
const {
	Utils: {
		fs: { mkdir, rmdir, exists },
	},
} = require('klayr-service-framework');

const { downloadAndExtractTarball, downloadFile } = require('../../../../shared/utils/download');

const dirPath = `${__dirname}/test_data/`;
const url = 'https://codeload.github.com/klayrhq/klayr-service/tar.gz/refs/tags/v0.7.7';

beforeEach(async () => mkdir(dirPath));

afterEach(async () => rmdir(dirPath));

describe('Test downloadAndExtractTarball method', () => {
	it('should download and extract correctly when url and data directory is valid', async () => {
		await downloadAndExtractTarball(url, dirPath);
		expect(await exists(`${dirPath}/klayr-service-0.7.7`)).toEqual(true);
	});

	it('should throw error when url is invalid', async () => {
		expect(downloadAndExtractTarball(`${url}/invalid_file`, dirPath)).rejects.toThrow();
	});

	it('should throw error when url is undefined', async () => {
		expect(downloadAndExtractTarball(undefined, dirPath)).rejects.toThrow();
	});

	it('should throw error when url is null', async () => {
		expect(downloadAndExtractTarball(null, dirPath)).rejects.toThrow();
	});

	it('should throw error when dirPath is undefined', async () => {
		expect(downloadAndExtractTarball(url, undefined)).rejects.toThrow();
	});

	it('should throw error when dirPath is null', async () => {
		expect(downloadAndExtractTarball(url, null)).rejects.toThrow();
	});

	it('should throw error when both url and dirPath are undefined', async () => {
		expect(downloadAndExtractTarball(undefined, undefined)).rejects.toThrow();
	});

	it('should throw error when both url and dirPath are null', async () => {
		expect(downloadAndExtractTarball(null, null)).rejects.toThrow();
	});
});

describe('Test downloadFile method', () => {
	const fileUrl =
		'https://api.github.com/repos/vardan10/app-registry-forked/contents/betanet/Enevti/nativetokens.json?ref=finalTestBranch';
	const headers = { 'User-Agent': 'GitHub-File-Downloader' };
	const filePath = `${dirPath}/test.json`;

	it('should download file for a correct url and file path', async () => {
		await mkdir(dirPath);
		await downloadFile(fileUrl, headers, filePath);

		expect(await exists(filePath)).toEqual(true);
		await rmdir(filePath);
	});

	it('should throw error when url is invalid', async () => {
		expect(downloadFile(`${fileUrl}/invalid_file`, headers, filePath)).rejects.toThrow();
	});

	it('should throw error when url is undefined', async () => {
		expect(downloadFile(undefined, headers, filePath)).rejects.toThrow();
	});

	it('should throw error when url is null', async () => {
		expect(downloadFile(null, headers, filePath)).rejects.toThrow();
	});

	it('should throw error when file path is undefined', async () => {
		expect(downloadFile(url, headers, undefined)).rejects.toThrow();
	});

	it('should throw error when file path is null', async () => {
		expect(downloadFile(url, headers, null)).rejects.toThrow();
	});

	it('should throw error when both url and file path are undefined', async () => {
		expect(downloadFile(undefined, headers, undefined)).rejects.toThrow();
	});

	it('should throw error when both url and file path are null', async () => {
		expect(downloadFile(null, headers, null)).rejects.toThrow();
	});
});
