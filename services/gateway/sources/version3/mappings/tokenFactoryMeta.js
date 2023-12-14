module.exports = {
	chainID: '=,string',
	chainName: '=,string',
	tokenID: '=,string',
	tokenName: '=,string',
	networkType: 'network,string',
	description: '=,string',
	logo: {
		png: '=,string',
		svg: '=,string',
	},
	symbol: '=,string',
	displayDenom: '=,string',
	baseDenom: '=,string',
	denomUnits: [
		'denomUnits',
		{
			denom: '=,string',
			decimals: '=,number',
			aliases: '=',
		},
	],
};
