import path from 'path';

import glob from 'glob';
import {plugin} from 'postcss';

import transformer from './lib/transformer';

export default plugin('postcss-functions', (opts = {}) => {
	const functions = opts.functions || {};
	let globs = opts.glob || [];

	if (!Array.isArray(globs))
		globs = [globs];

	globs.forEach(pattern => {
		glob.sync(pattern).forEach(file => {
			const name = path.basename(file, path.extname(file));
			functions[name] = require(file);
		});
	});

	const transform = transformer(functions);

	return css => {
		const promises = [];
		css.walk(node => {
			promises.push(transform(node));
		});
		return Promise.all(promises);
	};
});

/*
var postcss = require('postcss'),
	assign = require('object-assign'),
	glob = require('glob'),
	path = require('path'),
	transformNode = require('./transform').transformNode,
	isPromise = require('./promiseHelpers').isPromise;

module.exports = postcss.plugin('postcss-functions', function (opts) {
	opts = assign({
		functions: {},
		glob: []
	}, opts);

	if (!(opts.glob instanceof Array)) opts.glob = [opts.glob];

	opts.glob.forEach(function(pattern) {
		glob.sync(pattern).forEach(function(file) {
			var name = path.basename(file, path.extname(file));
			opts.functions[name] = require(file);
		});
	});

	return function (css) {
		var promises = [];

		css.walk(function (node) {
			var maybePromise = transformNode(node, opts.functions);
			if (isPromise(maybePromise)) {
				promises.push(maybePromise);
			}
		});

		return Promise.all(promises);
	};
});
*/