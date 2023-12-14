/* eslint-disable import/no-extraneous-dependencies */
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const {
	DB: {
		MySQL: { getTableInstance },
	},
} = require('lisk-service-framework');

const config = require('../../../config');
const { getTickPriceTableSchema } = require('../../database/dynamic-schema/tickPrice');

const MYSQL_ENDPOINT = config.endpoints.mysql;

const getTickPriceTable = pair =>
	getTableInstance(
		getTickPriceTableSchema(pair).tableName,
		getTickPriceTableSchema(pair),
		MYSQL_ENDPOINT,
	);

const generateSparklineBuffer = async (base, quote, interval, limit) => {
	if (typeof base !== 'string') throw new Error('invalid base');
	if (typeof quote !== 'string') throw new Error('invalid quote');
	if (typeof interval !== 'number') throw new Error('invalid interval');
	if (typeof limit !== 'number') throw new Error('invalid limit');

	const pair = `${base.toLowerCase()}${
		quote.toLowerCase() === 'usd' ? 'lsk' : quote.toLowerCase()
	}`;
	const joinQuery = `${
		quote.toLowerCase() === 'usd' ? 'LEFT JOIN tick_lskusd AS quote ON base.time = quote.time' : ''
	}`;
	const limitQuery = limit === -1 ? '' : `LIMIT ${limit}`;

	const query = `
            SELECT *
            FROM (
                SELECT
                    base.time,
                    base.value * ${quote.toLowerCase() === 'usd' ? 'quote.value' : '1'} AS value
                FROM
                    tick_${pair} AS base
                    ${joinQuery}
                WHERE
                    MOD(base.time, ${interval}) = 0
                ORDER BY
                    base.time DESC
                ${limitQuery}
                ) AS latest_entries
            ORDER BY time ASC;
    `;

	const tickPriceTable = await getTickPriceTable(pair);
	const prices = await tickPriceTable.rawQuery(query);
	const data = prices.map(t => t.value);

	const canvasRenderService = new ChartJSNodeCanvas({
		type: 'svg',
		width: 164,
		height: 48,
	});

	const configuration = {
		type: 'line',
		data: {
			labels: Array.from({ length: data.length }, (_, i) => i + 1),
			datasets: [
				{
					data,
					borderColor: data[0] <= data[data.length] ? '#60BE89' : '#D65263',
					borderWidth: 2,
					pointRadius: 0,
				},
			],
		},
		options: {
			maintainAspectRatio: false,
			scales: {
				x: { display: false },
				y: { display: false },
			},
			plugins: {
				legend: { display: false },
				tooltip: { enabled: false },
			},
		},
	};

	const image = canvasRenderService.renderToBufferSync(configuration);
	return image.toString('hex');
};

module.exports = { generateSparklineBuffer };
