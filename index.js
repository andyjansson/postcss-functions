var postcss = require('postcss'),
	valueParser = require('postcss-value-parser'),
	assign = require('object-assign'),
	glob = require('glob'),
	path = require('path');

function isPromise (obj) {
	// See: https://github.com/ssnau/xkit/blob/master/util/is-promise.js
	return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

function then(promiseOrResult, onFulfilled) {
	if (isPromise(promiseOrResult)) {
		return promiseOrResult.then(onFulfilled);
	}
	return onFulfilled(promiseOrResult);
}

function processArgs(nodes, functions) {
	var args = [];
	var argsContainPromise = false;

	var last = nodes.reduce(function (prev, node) {
		if (node.type === 'div' && node.value === ',') {
			args.push(prev);
			return '';
		}
		if (node.type !== 'function' || !functions.hasOwnProperty(node.value)) {
			return prev + valueParser.stringify(node);
		}
		var resultOrPromise = transformFunction(node, functions);
		argsContainPromise = argsContainPromise || isPromise(resultOrPromise);
		return then(resultOrPromise, function (result) {
			return prev + result;
		});
	}, '');
	if (last) {
		args.push(last);
	}

	if (argsContainPromise) {
		args = Promise.all(args);
	}

	return args;
}

function transformFunction(node, functions) {
	var argsOrPromise = processArgs(node.nodes, functions);
	return then(argsOrPromise, function (args) {
		var func = functions[node.value];
		return func.apply(func, args);
	});
}

function transform(value, functions) {
	var promises = [];

	var values = valueParser(value).walk(function (node) {
		if (node.type !== 'function' || !functions.hasOwnProperty(node.value)) {
			return;
		}
		var resultOrPromise = transformFunction(node, functions);
		resultOrPromise = then(resultOrPromise, function (result) {
			node.type = 'word';
			node.value = result;
		});
		if (isPromise(resultOrPromise)) {
			promises.push(resultOrPromise);
		}
	}, true);

	var maybePromises = promises.length ? Promise.all(promises) : null;
	return then(maybePromises, function () {
		return values.toString();
	});
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
				var resultOrPromise = transform(node.value, opts.functions);
				resultOrPromise = then(resultOrPromise, function (result) {
					node.value = result;
				});
				if (isPromise(resultOrPromise)) {
					promises.push(resultOrPromise);
				}
			} else if (node.type === 'atrule') {
				var resultOrPromise = transform(node.params, opts.functions);
				resultOrPromise = then(resultOrPromise, function (result) {
					node.params = result;
				});
				if (isPromise(resultOrPromise)) {
					promises.push(resultOrPromise);
				}
			}
		});

		return Promise.all(promises);
	};
});
