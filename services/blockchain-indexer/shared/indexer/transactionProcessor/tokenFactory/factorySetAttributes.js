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
	EVENT_NAME_TOKEN_FACTORY_SET_ATTRIBUTES,
} = require('../../../../../blockchain-connector/shared/sdk/constants/names');
const { requestGateway } = require('../../../utils/request');
const { factoryMetadataSchema } = require('../../../dataService/tokenFactory/schema');
const { invokeEndpoint } = require('../../../dataService/invoke');

const getTokenFactoryTable = () => getTableInstance(tokenFactoryTableSchema, MYSQL_ENDPOINT);
const getTokenMetadataTable = () => getTableInstance(tokenMetadataTableSchema, MYSQL_ENDPOINT);

// Declare and export the following command specific constants
const COMMAND_NAME = 'factorySetAttributes';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = async (blockHeader, tx, events, dbTrx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	const factorySetAttributesEvent = parseSingleEvent(
		events,
		MODULE_NAME_TOKEN_FACTORY,
		EVENT_NAME_TOKEN_FACTORY_SET_ATTRIBUTES,
		tx.id,
	);

	const onChainFactoryData = await invokeEndpoint({
		endpoint: 'tokenFactory_getFactory',
		params: {
			tokenId: factorySetAttributesEvent.data.tokenId,
		},
	});

	const tokenFactory = await getTokenFactoryTable();
	const tokenMetadataTable = await getTokenMetadataTable();

	const param = {
		tokenID: factorySetAttributesEvent.data.tokenId,
	};

	if (factorySetAttributesEvent.data.key === 'svg') {
		const svgAttribute = onChainFactoryData.data.attributesArray.find(t => t.key === 'svg');
		if (!svgAttribute) {
			logger.debug(
				`No svg attribute found on tokenId factory: ${factorySetAttributesEvent.data.tokenId}`,
			);
			return;
		}

		const metadata = await tokenFactory.find({ tokenID: factorySetAttributesEvent.data.tokenId }, [
			'symbol',
		]);
		if (!metadata) {
			logger.debug(
				`Failed to update svg attribute, no prior metadata attribute found for tokenId: ${factorySetAttributesEvent.data.tokenId}`,
			);
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
		logger.debug(`Updated svg for tokenId: ${factorySetAttributesEvent.data.tokenId}`);
	}

	if (factorySetAttributesEvent.data.key === 'metadata') {
		const metadataAttribute = onChainFactoryData.data.attributesArray.find(
			t => t.key === 'metadata',
		);
		if (!metadataAttribute) {
			logger.debug(
				`No metadata attribute found on tokenId factory: ${factorySetAttributesEvent.data.tokenId}`,
			);
			return;
		}

		const metadata = codec.decode(
			factoryMetadataSchema,
			Buffer.from(metadataAttribute.attributes, 'hex'),
		);

		await tokenFactory.upsert(
			{
				...param,
				...metadata,
			},
			dbTrx,
		);

		await tokenMetadataTable.upsert(
			{
				chainName: 'swaptoshi',
				network:
					factorySetAttributesEvent.data.tokenId.slice(0, 2) === '00'
						? 'mainnet'
						: factorySetAttributesEvent.data.tokenId.slice(0, 2) === '01'
						? 'testnet'
						: factorySetAttributesEvent.data.tokenId.slice(0, 2) === '04'
						? 'devnet'
						: 'unknown',
				tokenName: metadata.tokenName,
				tokenID: factorySetAttributesEvent.data.tokenId,
			},
			dbTrx,
		);

		logger.debug(`Updated metadata for tokenId: ${factorySetAttributesEvent.data.tokenId}`);
	}

	Promise.resolve({ blockHeader, tx });
};

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = async (blockHeader, tx) => {
	if (tx.executionStatus !== TRANSACTION_STATUS.SUCCESSFUL) return;

	logger.debug(
		`No implementation for factorySetAttributes revertTransaction, current attributes may not reflect finalized blockchain data`,
	);

	Promise.resolve({ blockHeader, tx });
};

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
