var postcss = require('postcss'),
	valueParser = require('postcss-value-parser'),
	assign = require('object-assign'),
	glob = require('glob'),
	path = require('path');

function processArgs(nodes, functions) {
	var args = [];
	var last = nodes.reduce(function (prev, node) {
		if (node.type === 'div' && node.value === ',') {
			args.push(prev);
			return '';
		}
		if (node.type !== 'function' || !functions.hasOwnProperty(node.value)) {
			return prev + valueParser.stringify(node);
		}
		return transformFunction(node, functions)
			.then(function (result) {
				return prev + result;
			});
	}, '');
	if (last) {
		args.push(last);
	}

	return Promise.all(args);
}

function transformFunction(node, functions) {
	return processArgs(node.nodes, functions)
		.then(function (args) {
			var func = functions[node.value];
			return Promise.resolve(func.apply(func, args));
		});
}

function transform(value, functions) {
	var promises = [];

	var values = valueParser(value).walk(function (node) {
		if (node.type !== 'function' || !functions.hasOwnProperty(node.value)) {
			return;
		}
		var promise = transformFunction(node, functions)
			.then(function (result) {
				node.type = 'word';
				node.value = result;
			});
		promises.push(promise);
	}, true);

	return Promise.all(promises)
		.then(function () {
			return values.toString();
		})
}

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
			if (node.type === 'decl') {
				promises.push(transform(node.value, opts.functions)
					.then(function (result) {
						node.value = result;
					}));
			} else if (node.type === 'atrule') {
				promises.push(transform(node.params, opts.functions)
					.then(function (result) {
						node.params = result;
					}));
			}
		});

		return Promise.all(promises);
	};
});
