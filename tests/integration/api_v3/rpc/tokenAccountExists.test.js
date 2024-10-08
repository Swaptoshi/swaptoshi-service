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

const config = require('../../../config');
const { request } = require('../../../helpers/socketIoRpcRequest');

const {
	invalidParamsSchema,
	jsonRpcEnvelopeSchema,
	invalidRequestSchema,
} = require('../../../schemas/rpcGenerics.schema');
const { tokenAccountExistsSchema } = require('../../../schemas/api_v3/tokenAccountExists.schema');
const {
	invalidNames,
	invalidPublicKeys,
	invalidAddresses,
	invalidTokenIDs,
} = require('../constants/invalidInputs');

const wsRpcUrl = `${config.SERVICE_ENDPOINT}/rpc-v3`;

const getTokenAccountExists = async params => request(wsRpcUrl, 'get.token.account.exists', params);

describe('get.token.account.exists', () => {
	let refValidator;
	let refTokenID;
	const unknownTokenID = '9999999999999999';
	beforeAll(async () => {
		let refValidatorAddress;
		do {
			const transactionsResponse = await request(wsRpcUrl, 'get.transactions', {
				moduleCommand: 'pos:stake',
				limit: 1,
			});
			const { data: [stakeTx] = [] } = transactionsResponse.result;
			if (stakeTx) {
				// Destructure to refer first entry of all the sent votes within the transaction
				const {
					params: {
						stakes: [stake],
					},
				} = stakeTx;
				refValidatorAddress = stake.validatorAddress;
			}
		} while (!refValidatorAddress);
		const validatorsResponse = await request(wsRpcUrl, 'get.pos.validators', {
			address: refValidatorAddress,
		});
		[refValidator] = validatorsResponse.result.data;
		// Fetch tokenID
		const tokenConstantsResponse = await request(wsRpcUrl, 'get.pos.constants');
		refTokenID = tokenConstantsResponse.result.data.posTokenID;
	});

	it('should return isExists:true when requested for known address', async () => {
		const response = await getTokenAccountExists({
			address: refValidator.address,
			tokenID: refTokenID,
		});
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result).toMap(tokenAccountExistsSchema);
		expect(result.data.isExists).toBe(true);
	});

	it('should return isExists:false when requested for unknown address', async () => {
		const response = await getTokenAccountExists({
			address: 'klyvmcf8bphtskyv49xg866u9a9dm7ftkxremzbkr',
			tokenID: refTokenID,
		});
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result).toMap(tokenAccountExistsSchema);
		expect(result.data.isExists).toBe(false);
	});

	it('should return isExists:false when requested for incorrect tokenID with known address', async () => {
		const response = await getTokenAccountExists({
			address: refValidator.address,
			tokenID: unknownTokenID,
		});
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result).toMap(tokenAccountExistsSchema);
		expect(result.data.isExists).toBe(false);
	});

	it('should return isExists:true requested for known publicKey', async () => {
		if (refValidator.publicKey) {
			const response = await getTokenAccountExists({
				publicKey: refValidator.publicKey,
				tokenID: refTokenID,
			});
			expect(response).toMap(jsonRpcEnvelopeSchema);
			const { result } = response;
			expect(result).toMap(tokenAccountExistsSchema);
			expect(result.data.isExists).toBe(true);
		}
	});

	it('should return isExists:false requested for unknown publicKey', async () => {
		const response = await getTokenAccountExists({
			publicKey: '7dda7d86986775bd9ee4bc2f974e31d58b5280e02513c216143574866933bbdf',
			tokenID: refTokenID,
		});
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result).toMap(tokenAccountExistsSchema);
		expect(result.data.isExists).toBe(false);
	});

	it('should return isExists:false requested for incorrect tokenID with known publicKey', async () => {
		if (refValidator.publicKey) {
			const response = await getTokenAccountExists({
				publicKey: refValidator.publicKey,
				tokenID: unknownTokenID,
			});
			expect(response).toMap(jsonRpcEnvelopeSchema);
			const { result } = response;
			expect(result).toMap(tokenAccountExistsSchema);
			expect(result.data.isExists).toBe(false);
		}
	});

	it('should return isExists:true when requested for known validator name', async () => {
		if (refValidator.name) {
			const response = await getTokenAccountExists({
				name: refValidator.name,
				tokenID: refTokenID,
			});
			expect(response).toMap(jsonRpcEnvelopeSchema);
			const { result } = response;
			expect(result).toMap(tokenAccountExistsSchema);
			expect(result.data.isExists).toBe(true);
		}
	});

	it('should return isExists:false when requested for unknown validator name', async () => {
		const response = await getTokenAccountExists({ name: 'yyyy', tokenID: refTokenID });
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result).toMap(tokenAccountExistsSchema);
		expect(result.data.isExists).toBe(false);
	});

	it('should return isExists:false when requested for incorrect tokenID with known validator name', async () => {
		const response = await getTokenAccountExists({
			name: refValidator.name,
			tokenID: unknownTokenID,
		});
		expect(response).toMap(jsonRpcEnvelopeSchema);
		const { result } = response;
		expect(result).toMap(tokenAccountExistsSchema);
		expect(result.data.isExists).toBe(false);
	});

	it('should return bad request for missing tokenID', async () => {
		const response = await await getTokenAccountExists();
		expect(response).toMap(invalidRequestSchema);
	});

	it('should return bad request when requested with only address', async () => {
		const response = await await getTokenAccountExists({ address: refValidator.address });
		expect(response).toMap(invalidRequestSchema);
	});

	it('should return bad request when requested with only publicKey', async () => {
		const response = await await getTokenAccountExists({ publicKey: refValidator.publicKey });
		expect(response).toMap(invalidRequestSchema);
	});

	it('should return bad request when requested with only name', async () => {
		const response = await await getTokenAccountExists({ name: refValidator.name });
		expect(response).toMap(invalidRequestSchema);
	});

	it('should return bad request for an invalid param', async () => {
		const response = await await getTokenAccountExists({
			name: refValidator.name,
			tokenID: refTokenID,
			invalidParam: 'invalid',
		});
		expect(response).toMap(invalidParamsSchema);
	});

	it('should return bad request for an invalid empty param', async () => {
		const response = await await getTokenAccountExists({
			name: refValidator.name,
			tokenID: refTokenID,
			invalidParam: '',
		});
		expect(response).toMap(invalidParamsSchema);
	});

	it('should return bad request for an invalid token ID', async () => {
		for (let i = 0; i < invalidTokenIDs.length; i++) {
			const response = await getTokenAccountExists({
				tokenID: invalidTokenIDs[i],
				address: refValidator.address,
			});
			expect(response).toMap(invalidParamsSchema);
		}
	});

	it('should return bad request for an invalid address', async () => {
		for (let i = 0; i < invalidAddresses.length; i++) {
			const response = await getTokenAccountExists({
				tokenID: refTokenID,
				address: invalidAddresses[i],
			});
			expect(response).toMap(invalidParamsSchema);
		}
	});

	it('should return bad request for an invalid publicKey', async () => {
		for (let i = 0; i < invalidPublicKeys.length; i++) {
			const response = await getTokenAccountExists({
				tokenID: refTokenID,
				publicKey: invalidPublicKeys[i],
			});
			expect(response).toMap(invalidParamsSchema);
		}
	});

	it('should return bad request for an invalid name', async () => {
		for (let i = 0; i < invalidNames.length; i++) {
			const response = await getTokenAccountExists({ tokenID: refTokenID, name: invalidNames[i] });
			expect(response).toMap(invalidParamsSchema);
		}
	});
});
