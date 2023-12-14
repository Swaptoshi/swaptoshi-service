const ADDR_SIZE = 8;
const FEE_SIZE = 3;

const NEXT_OFFSET = ADDR_SIZE + FEE_SIZE;
const POP_OFFSET = NEXT_OFFSET + ADDR_SIZE;
const MULTIPLE_POOLS_MIN_LENGTH = POP_OFFSET + NEXT_OFFSET;

function hasMultiplePools(path) {
	return path.length >= MULTIPLE_POOLS_MIN_LENGTH * 2;
}

function numPools(path) {
	return (path.length - ADDR_SIZE * 2) / (NEXT_OFFSET * 2);
}

function decodeFirstPool(path) {
	return [
		path.substring(0, 16),
		path.substring(NEXT_OFFSET * 2, NEXT_OFFSET * 2 + 16),
		Buffer.from(path.substring(ADDR_SIZE * 2, ADDR_SIZE * 2 + 6))
			.readUintBE(0, 3)
			.toString(),
	];
}

function getFirstPool(path) {
	return path.substring(0, POP_OFFSET * 2);
}

function skipToken(path) {
	return path.substring(NEXT_OFFSET * 2);
}

module.exports = {
	hasMultiplePools,
	numPools,
	decodeFirstPool,
	getFirstPool,
	skipToken,
};
