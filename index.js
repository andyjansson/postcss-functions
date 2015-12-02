var postcss = require('postcss'),
	valueParser = require('postcss-value-parser'),
	assign = require('object-assign'),
	glob = require('glob'),
	path = require('path');

function processArgs(nodes) {
	if (!nodes.length) {
		return [];
	}
	var i, max, lastIndex;
	var args = [''];

	for (i = 0, max = nodes.length; i < max; i += 1) {
		lastIndex = args.length - 1;
		if (nodes[i].type === 'div' && nodes[i].value === ',') {
			args[lastIndex] = args[lastIndex].trim();
			args.push('');
		} else {
			args[lastIndex] += valueParser.stringify(nodes[i]);
		}
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
	}).toString();
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
		css.walkDecls(function (decl) {
			decl.value = transform(decl.value, opts.functions);
		});
		css.walkAtRules(function (rule) {
			rule.params = transform(rule.params, opts.functions);
		});
	};
});
