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

const ADDRESS_KLAYR32 = /^kly[a-hjkm-z2-9]{38}$/;
const BLS_KEY = /^\b[a-fA-F0-9]{96}\b$/;
const PROOF_OF_POSSESSION = /^\b[a-fA-F0-9]{192}\b$/;
const PUBLIC_KEY = /^([A-Fa-f0-9]{2}){32}$/;
const NAME = /^[a-z0-9!@$&_.]{1,20}$/;
const TOKEN_ID = /^\b[a-fA-F0-9]{16}\b$/;
const MAINCHAIN_ID = /^[a-fA-F0-9]{2}000000$/;
const CHAIN_ID = /^\b[a-fA-F0-9]{8}\b$/;

module.exports = {
	ADDRESS_KLAYR32,
	BLS_KEY,
	PROOF_OF_POSSESSION,
	PUBLIC_KEY,
	NAME,
	TOKEN_ID,
	MAINCHAIN_ID,
	CHAIN_ID,
};
