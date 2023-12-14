const cryptography = require('@liskhq/lisk-cryptography');

function getPoolKey(tokenA, tokenB, fee) {
	if (tokenA === tokenB) throw new Error('same token address');

	const token0 = tokenA < tokenB ? tokenA : tokenB;
	const token1 = tokenA < tokenB ? tokenB : tokenA;
	return { token0, token1, fee };
}

function decodePoolAddress(poolAddress) {
	let pool = poolAddress;
	if (typeof poolAddress === 'string') {
		if (poolAddress.length === 41)
			pool = cryptography.address.getAddressFromLisk32Address(poolAddress);
		else pool = Buffer.from(poolAddress, 'hex');
	}
	return {
		token0: pool.subarray(0, 8).toString('hex'),
		token1: pool.subarray(8, 16).toString('hex'),
		fee: pool.subarray(16).readUIntBE(0, 4).toString(),
	};
}

function computePoolAddress(key) {
	const { token1, token0 } = key;

	if (token0 === '0'.repeat(16) && token1 === '0'.repeat(16) && key.fee === '0') {
		throw new Error('zero');
	}

	if (token0 > token1) {
		throw new Error('invalid token0/token1');
	}

	if (token0 === '') {
		throw new Error('invalid token0');
	}

	const feeBuf = Buffer.allocUnsafe(4);
	feeBuf.writeUIntBE(parseInt(key.fee, 10), 0, 4);
	return Buffer.concat([Buffer.from(token0, 'hex'), Buffer.from(token1, 'hex'), feeBuf]);
}

function computePoolId(poolAddress) {
	let pool = poolAddress;
	if (typeof poolAddress === 'string')
		pool = cryptography.address.getAddressFromLisk32Address(poolAddress);
	if (pool.length !== 20) throw new Error('invalid poolAddress');
	return cryptography.utils.hash(pool).subarray(0, 4).toString('hex');
}

function decodeNFTId(nftId) {
	const nft = Buffer.from(nftId, 'hex');
	return {
		chainId: nft.subarray(0, 4).toString('hex'),
		collectionId: nft.subarray(4, 8).toString('hex'),
		index: nft.subarray(8).readBigInt64BE(),
	};
}

module.exports = {
	getPoolKey,
	decodePoolAddress,
	computePoolAddress,
	computePoolId,
	decodeNFTId,
};
