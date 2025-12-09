const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

module.exports = {
	mode: 'development',
	entry: {
		"app": './base/app.js'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'app.js'
	},
	module: {
			rules: [{
			test: /\.css$/,
			use: ['style-loader', 'css-loader']
		}, {
			test: /\.ttf$/,
			use: ['url-loader']
		}],
		
	},
	externals: {
		jquery: 'jQuery'
	},
	node: {
		net: 'empty'
	},
	resolve: {
		alias: {
            'vscode': require.resolve('monaco-languageclient/lib/vscode-compatibility')
        },
		extensions: ['.js', '.jsx', '.css','json','ttf'],
		modules: [
		  'node_modules'
		]        
	},
	plugins: [new MonacoWebpackPlugin()]
};