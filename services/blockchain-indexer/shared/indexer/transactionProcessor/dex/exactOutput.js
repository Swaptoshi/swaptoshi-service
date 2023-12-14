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
	applyTransaction: swapApplyTransaction,
	revertTransaction: swapRevertTransaction,
} = require('./exactInput');

// Declare and export the following command specific constants
const COMMAND_NAME = 'exactOutput';

// Implement the custom logic in the 'applyTransaction' method and export it
const applyTransaction = swapApplyTransaction;

// Implement the custom logic in the 'revertTransaction' method and export it
// This logic is executed to revert the effect of 'applyTransaction' method in case of deleteBlock
const revertTransaction = swapRevertTransaction;

module.exports = {
	COMMAND_NAME,
	applyTransaction,
	revertTransaction,
};
