var postcss = require('postcss'),
	valueParser = require('postcss-value-parser'),
	assign = require('object-assign'),
	glob = require('glob'),
	path = require('path');

function processArgs(nodes) {
	var args = [];
	var last = nodes.reduce(function (prev, node) {
		if (node.type === 'div' && node.value === ',') {
			args.push(prev);
			return '';
		}
		return prev + valueParser.stringify(node);
	}, '');
	if (last) {
		args.push(last);
	}

	return args;
}

function transform(value, functions) {
	return valueParser(value).walk(function (node) {
		if (node.type !== 'function' || !functions.hasOwnProperty(node.value)) {
			return;
		}
		var func = functions[node.value];
		var args = processArgs(node.nodes);
		node.type = 'word';
		node.value = func.apply(func, args);
	}, true).toString();
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
		css.walk(function (node) {
			if (node.type === 'decl') {
				node.value = transform(node.value, opts.functions);
			} else if (node.type === 'atrule') {
				node.params = transform(node.params, opts.functions);
			}
		});
	};
});
