import transformer from './lib/transformer';
import {hasPromises} from './lib/helpers'

function plugin(opts = {}) {
	const functions = opts.functions || {};
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
