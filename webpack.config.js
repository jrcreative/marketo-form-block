/**
 * Webpack configuration for Marketo Form Block
 */

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        index: path.resolve(process.cwd(), 'src', 'index.js'),
        frontend: path.resolve(process.cwd(), 'src', 'frontend.js'),
    },
    output: {
        ...defaultConfig.output,
        path: path.resolve(process.cwd(), 'build'),
    },
};