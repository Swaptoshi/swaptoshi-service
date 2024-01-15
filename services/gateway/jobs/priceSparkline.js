const { updatePriceSparkline } = require('../shared/priceSparkline');

module.exports = [
	{
		name: 'update.price.sparkline.5min',
		description:
			'Update and generate price sparkline svg for all registered dex tokens - every 5 minute',
		interval: 0,
		schedule: '0,5,10,15,20,25,30,35,40,45,50,55 * * * *',
		init: async () => updatePriceSparkline([{ interval: 300, limit: 12, label: '1h' }]),
		controller: async () => updatePriceSparkline([{ interval: 300, limit: 12, label: '1h' }]),
	},
	{
		name: 'update.price.sparkline.15min',
		description:
			'Update and generate price sparkline svg for all registered dex tokens - every 15 minute',
		interval: 0,
		schedule: '0,15,30,45 * * * *',
		init: async () => updatePriceSparkline([{ interval: 900, limit: 96, label: '24h' }]),
		controller: async () => updatePriceSparkline([{ interval: 900, limit: 96, label: '24h' }]),
	},
	{
		name: 'update.price.sparkline.1hour',
		description:
			'Update and generate price sparkline svg for all registered dex tokens - every 1 hour',
		interval: 0,
		schedule: '0 * * * *',
		init: async () => updatePriceSparkline([{ interval: 3600, limit: 168, label: '7d' }]),
		controller: async () => updatePriceSparkline([{ interval: 3600, limit: 168, label: '7d' }]),
	},
	{
		name: 'update.price.sparkline.6hour',
		description:
			'Update and generate price sparkline svg for all registered dex tokens - every 6 hour',
		interval: 0,
		schedule: '0 0,6,12,18 * * *',
		init: async () => updatePriceSparkline([{ interval: 21600, limit: 120, label: '30d' }]),
		controller: async () => updatePriceSparkline([{ interval: 21600, limit: 120, label: '30d' }]),
	},
	{
		name: 'update.price.sparkline.1day',
		description:
			'Update and generate price sparkline svg for all registered dex tokens - every day',
		interval: 0,
		schedule: '0 0 * * *',
		init: async () => updatePriceSparkline([{ interval: 151200, limit: 192, label: '1y' }]),
		controller: async () => updatePriceSparkline([{ interval: 151200, limit: 192, label: '1y' }]),
	},
];
