import path from 'path';

import glob from 'glob';
import {plugin} from 'postcss';

import transformer from './lib/transformer';
import {hasPromises} from './lib/helpers'

export default plugin('postcss-functions', (opts = {}) => {
	const functions = opts.functions || {};
	const walk = opts.walk || ((css,cb) => css.walk(cb));
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
		walk(css, node => {
			promises.push(transform(node));
		});
		
		if (hasPromises(promises))
			return Promise.all(promises);
	};
});
