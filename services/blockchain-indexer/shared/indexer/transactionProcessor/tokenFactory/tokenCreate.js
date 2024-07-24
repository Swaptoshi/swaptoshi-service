/* eslint-disable no-nested-ternary */
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
	Logger,
	DB: {
		MySQL: { getTableInstance },
	},
} = require('klayr-service-framework');
const { codec } = require('@klayr/codec');
const svg2img = require('svg2img');
const config = require('../../../../config');

const { TRANSACTION_STATUS } = require('../../../constants');

const MYSQL_ENDPOINT = config.endpoints.mysql;
const SERVICE_URL = config.serviceUrl;

const logger = Logger();

const tokenFactoryTableSchema = require('../../../database/schema/token_factory');
const tokenMetadataTableSchema = require('../../../database/schema/token_metadata');
const { parseSingleEvent } = require('../../utils/events');
const {
	MODULE_NAME_TOKEN_FACTORY,
	EVENT_NAME_TOKEN_FACTORY_CREATED,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');
const { requestAppRegistry, requestGateway } = require('../../../utils/request');
const { factoryMetadataSchema } = require('../../../dataService/tokenFactory/schema');
const { invokeEndpoint } = require('../../../dataService/invoke');
const { isTokenAvailable } = require('../../../dataService');

const getTokenFactoryTable = () => getTableInstance(tokenFactoryTableSchema, MYSQL_ENDPOINT);
const getTokenMetadataTable = () => getTableInstance(tokenMetadataTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'tokenCreate';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const factoryCreatedEvent = parseSingleEvent(
		events,
		MODULE_NAME_TOKEN_FACTORY,
		EVENT_NAME_TOKEN_FACTORY_CREATED,
		tx.id,
	);

	const tokenFactory = await getTokenFactoryTable();
	const tokenMetadataTable = await getTokenMetadataTable();

	const onChainFactoryData = await invokeEndpoint({
		endpoint: 'tokenFactory_getFactory',
		params: {
			tokenId: factoryCreatedEvent.data.tokenId,
		},
	});

	const metadataAttribute = onChainFactoryData.data.attributesArray.find(t => t.key === 'metadata');
	if (!metadataAttribute) {
		logger.debug(`No metadata attribute found on factoryCreate transaction with tx id: ${tx.id}`);
		return;
	}

	const metadata = codec.decode(
		factoryMetadataSchema,
		Buffer.from(metadataAttribute.attributes, 'hex'),
	);

	const available = await isTokenAvailable(metadata);
	if (!available.data.available) {
		logger.debug('tokenName and/or symbol is not available');
		return;
	}

	const param = {
		...metadata,
		tokenID: factoryCreatedEvent.data.tokenId,
		owner: factoryCreatedEvent.data.ownerAddress,
		supply: factoryCreatedEvent.data.amount,
	};

	const registryData = await requestAppRegistry('blockchain.apps.meta.tokens', {
		tokenID: factoryCreatedEvent.data.tokenId,
	});

	if (registryData.data.length > 0) {
		param.tokenName = registryData.data[0].tokenName;
		param.description = registryData.data[0].description;
		param.baseDenom = registryData.data[0].baseDenom;
		param.symbol = registryData.data[0].symbol;
		param.logoPng = registryData.data[0].logo.png;

		const decimal = registryData.data[0].denomUnits.find(
			t => t.denom === registryData.data[0].displayDenom,
		);
		if (decimal !== undefined) param.decimal = decimal.decimals;
	}

	const svgAttribute = onChainFactoryData.data.attributesArray.find(t => t.key === 'svg');
	if (!svgAttribute) {
		logger.debug(`No svg attribute found on factoryCreate transaction with tx id: ${tx.id}`);
		return;
	}

	let pngBuffer = '';

	svg2img(
		Buffer.from(svgAttribute.attributes, 'hex').toString('utf8'),
		{ format: 'png', resvg: { fitTo: { mode: 'width', value: 64 } } },
		(error, buffer) => (pngBuffer = buffer),
	);

	await requestGateway('logo.save', {
		fileName: `${metadata.symbol.toLowerCase()}.svg`,
		data: svgAttribute.attributes.toString('hex'),
	});

	await requestGateway('logo.save', {
		fileName: `${metadata.symbol.toLowerCase()}.png`,
		data: pngBuffer.toString('hex'),
	});

	param.logoSvg = `${SERVICE_URL}/static/img/logo/${metadata.symbol.toLowerCase()}.svg`;
	param.logoPng = `${SERVICE_URL}/static/img/logo/${metadata.symbol.toLowerCase()}.png`;

	await tokenFactory.upsert(param, dbTrx);
	await tokenMetadataTable.upsert(
		{
			chainName: 'swaptoshi',
			network:
				factoryCreatedEvent.data.tokenId.slice(0, 2) === '00'
					? 'mainnet'
					: factoryCreatedEvent.data.tokenId.slice(0, 2) === '01'
					? 'testnet'
					: factoryCreatedEvent.data.tokenId.slice(0, 2) === '04'
					? 'devnet'
					: 'unknown',
			tokenName: metadata.tokenName,
			tokenID: factoryCreatedEvent.data.tokenId,
		},
		dbTrx,
	);

	logger.debug(`Added token logo and metadata to index: ${factoryCreatedEvent.data.tokenId}`);

	logger.debug(`Added tokenId to index: ${factoryCreatedEvent.data.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const factoryCreatedEvent = parseSingleEvent(
		events,
		MODULE_NAME_TOKEN_FACTORY,
		EVENT_NAME_TOKEN_FACTORY_CREATED,
		tx.id,
	);

	const tokenFactory = await getTokenFactoryTable();
	const tokenMetadataTable = await getTokenMetadataTable();

	const metadata = await tokenFactory.find({ tokenID: factoryCreatedEvent.data.tokenId }, [
		'symbol',
	]);

	if (metadata) {
		await requestGateway('logo.delete', {
			fileName: `${metadata.symbol.toLowerCase()}.svg`,
		});

		await requestGateway('logo.delete', {
			fileName: `${metadata.symbol.toLowerCase()}.png`,
		});
	}

	await tokenFactory.deleteByPrimaryKey(factoryCreatedEvent.data.tokenId, dbTrx);
	await tokenMetadataTable.deleteByPrimaryKey(factoryCreatedEvent.data.tokenId, dbTrx);

	logger.debug(`Removed tokenId from index: ${factoryCreatedEvent.data.tokenId}`);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
