const path = require('path');

module.exports = {
	mode: 'development',
	entry: {
		index: './preview-src/index.js'
	},
	resolve: {
		extensions: ['.js']
	},
	devtool: 'inline-source-map',
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'media')
	}
};