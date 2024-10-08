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
const {
	Exceptions: { NotFoundException },
} = require('klayr-service-framework');

const FileStorage = require('./helpers/file');
const S3Storage = require('./helpers/s3');

const DRIVERS = {
	FILESYSTEM: 'filesystem',
	S3: 's3-minio',
};

const objectCacheFS = params => {
	const { init, write, read, fileExists, remove, purge, isFile, isFilePathInDirectory } =
		FileStorage;
	const { dirPath, retentionInDays } = params;

	init({ dirPath });

	return {
		write: (filename, content) => write(`${dirPath}/${filename}`, content),
		read: filename => {
			if (isFilePathInDirectory(`${dirPath}/${filename}`, dirPath)) {
				return read(`${dirPath}/${filename}`);
			}
			return Promise.reject(new Error('Filepath is not allowed.'));
		},
		fileExists: filename => fileExists(`${dirPath}/${filename}`),
		remove: filename => remove(`${dirPath}/${filename}`),
		purge: () => purge(dirPath, retentionInDays),
		isFile: filename => isFile(`${dirPath}/${filename}`),
	};
};

const objectCacheS3 = params => {
	const { init, write, read, exists, remove, purge, isFile } = S3Storage;
	const { retentionInDays } = params;

	init(params);

	return {
		write: (filename, content) => write(filename, content),
		read: filename => read(filename),
		exists: filename => exists(filename),
		remove: filename => remove(filename),
		purge: () => purge('', retentionInDays),
		isFile: filename => isFile(filename),
	};
};

const objectCache = params => {
	const { driver } = params;

	// Check if the storage `driver` is supported
	const KNOWN_DRIVERS = Object.values(DRIVERS);
	if (!KNOWN_DRIVERS.includes(driver)) {
		throw new NotFoundException(`${driver} driver not found. Use one of ${KNOWN_DRIVERS.join()}`);
	}

	if (driver === DRIVERS.S3) return objectCacheS3(params);

	// Default to filesystem
	return objectCacheFS(params);
};

module.exports = objectCache;
