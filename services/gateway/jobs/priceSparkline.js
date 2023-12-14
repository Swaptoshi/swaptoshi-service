const { updatePriceSparkline } = require('../shared/priceSparkline');

module.exports = [
	{
		name: 'update.price.sparkline.hourly',
		description: 'Update and generate price sparkline svg for all registered dex tokens - hourly',
		interval: 0,
		schedule: '0 * * * *',
		init: async () =>
			updatePriceSparkline([
				{ interval: 300, limit: 12, label: '1h' },
				{ interval: 900, limit: 96, label: '24h' },
			]),
		controller: async () =>
			updatePriceSparkline([
				{ interval: 300, limit: 12, label: '1h' },
				{ interval: 900, limit: 96, label: '24h' },
			]),
	},
	{
		name: 'update.price.sparkline.daily',
		description: 'Update and generate price sparkline svg for all registered dex tokens - daily',
		interval: 0,
		schedule: '0 0 * * *',
		init: async () =>
			updatePriceSparkline([
				{ interval: 3600, limit: 168, label: '7d' },
				{ interval: 21600, limit: 120, label: '30d' },
			]),
		controller: async () =>
			updatePriceSparkline([
				{ interval: 3600, limit: 168, label: '7d' },
				{ interval: 21600, limit: 120, label: '30d' },
			]),
	},
	{
		name: 'update.price.sparkline.biweekly',
		description: 'Update and generate price sparkline svg for all registered dex tokens - biweekly',
		interval: 0,
		schedule: '0 0 1,15 * *',
		init: async () => updatePriceSparkline([{ interval: 151200, limit: 192, label: '1y' }]),
		controller: async () => updatePriceSparkline([{ interval: 151200, limit: 192, label: '1y' }]),
	},
];
