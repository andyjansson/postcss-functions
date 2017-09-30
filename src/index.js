import path from 'path';

import glob from 'glob';
import {plugin} from 'postcss';

import transformer from './lib/transformer';
import {hasPromises, index} from './lib/helpers'

export default plugin('postcss-functions', (opts = {}) => {
	const functions = opts.functions || {};
	const withNode = index(opts.withNode || []);
	let globs = opts.glob || [];

	if (!Array.isArray(globs))
		globs = [globs];

	globs.forEach(pattern => {
		glob.sync(pattern).forEach(file => {
			const name = path.basename(file, path.extname(file));
			functions[name] = require(file);
		});
	});

	const transform = transformer(functions, withNode);

	return css => {
		const promises = [];
		css.walk(node => {
			promises.push(transform(node));
		});
		
		if (hasPromises(promises))
			return Promise.all(promises);
	};
});
