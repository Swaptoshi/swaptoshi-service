const { Logger } = require('klayr-service-framework');
const fs = require('fs');

const path = require('path');
const BluebirdPromise = require('bluebird');
const { requestIndexer } = require('./appContext');
const { intervalToSecond } = require('./utils');

const logger = Logger();

const updatePriceSparkline = async arrayParam => {
	const basePath = path.join(__dirname, '../public/static/img', 'sparklines');
	if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);

	const registeredDexTokens = await requestIndexer('dex.tokens.compact', { limit: -1 });
	const now = Math.floor(Date.now() / 1000);

	await BluebirdPromise.map(
		registeredDexTokens.data,
		async tokens => {
			await BluebirdPromise.map(
				arrayParam,
				async param => {
					if (tokens.symbol.toLowerCase() !== 'lsk') {
						const toLskBuff = await requestIndexer('dex.sparkline.buffer', {
							base: tokens.symbol.toLowerCase(),
							quote: 'lsk',
							interval: param.interval,
							limit: param.limit,
							start: now - intervalToSecond[param.label],
							end: now,
						});

						fs.writeFileSync(
							path.join(basePath, `${param.label}-${tokens.symbol.toLowerCase()}lsk.svg`),
							Buffer.from(toLskBuff, 'hex'),
						);
						logger.debug(`Generated: ${param.label}-${tokens.symbol.toLowerCase()}lsk.svg`);
					}

					const toUsdBuff = await requestIndexer('dex.sparkline.buffer', {
						base: tokens.symbol.toLowerCase(),
						quote: 'usd',
						interval: param.interval,
						limit: param.limit,
						start: now - intervalToSecond[param.label],
						end: now,
					});

					fs.writeFileSync(
						path.join(basePath, `${param.label}-${tokens.symbol.toLowerCase()}usd.svg`),
						Buffer.from(toUsdBuff, 'hex'),
					);
					logger.debug(`Generated: ${param.label}-${tokens.symbol.toLowerCase()}usd.svg`);

					return true;
				},
				{ concurrency: arrayParam.length },
			);
		},
		{ concurrency: 8 },
	);
};

module.exports = { updatePriceSparkline };
