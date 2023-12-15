const parseQueryResult = result => {
	if (
		Array.isArray(result) &&
		result.length === 2 &&
		Array.isArray(result[0]) &&
		Array.isArray(result[1])
	) {
		return result[0];
	}
	return result;
};

module.exports = { parseQueryResult };
