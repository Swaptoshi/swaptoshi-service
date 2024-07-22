const fs = require('fs');
const path = require('path');

const setLogo = async params => {
	const basePath = path.join(__dirname, '../public/static/img', 'logo');
	if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
	fs.writeFileSync(path.join(basePath, params.fileName), Buffer.from(params.data, 'hex'));
};

const deleteLogo = async params => {
	const basePath = path.join(__dirname, '../public/static/img', 'logo');
	if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
	fs.rmSync(path.join(basePath, params.fileName));
};

module.exports = {
	setLogo,
	deleteLogo,
};
