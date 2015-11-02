var postcss = require('postcss'),
	functionCall = require('reduce-function-call'),
	extend = require('util')._extend,
	glob = require('glob'),
	path = require('path');

module.exports = postcss.plugin('postcss-functions', function (opts) {
	opts = extend({
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
			for (var func in opts.functions) {
				if (decl.value.indexOf(func + '(') !== -1) {
					decl.value = functionCall(decl.value, func, function (args) {
						return opts.functions[func].apply(opts.functions[func], postcss.list.comma(args));
					});
				}
			}
		});
		css.walkAtRules(function (rule) {
			for (var func in opts.functions) {
				if (rule.params.indexOf(func + '(') !== -1) {
					rule.params = functionCall(rule.params, func, function (args) {
						return opts.functions[func].apply(opts.functions[func], postcss.list.comma(args));
					});
				}
			}
		});
	};
});
