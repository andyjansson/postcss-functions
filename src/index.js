import path from 'path';

import glob from 'glob';

import transformer from './lib/transformer';
import {hasPromises} from './lib/helpers'

function plugin(opts = {}) {
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

	return {
		postcssPlugin: 'postcss-functions',
		Once (css) {
			const promises = [];
			css.walk(node => {
				promises.push(transform(node));
			});

			if (hasPromises(promises))
				return Promise.all(promises);
		}
	}
}

plugin.postcss = true;

export default plugin;
