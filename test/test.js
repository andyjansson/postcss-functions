var assert = require('assert'),
	postcss = require('postcss'),
	functions = require('../src'),
	isPromise = require('../src/promiseHelpers').isPromise,
	transformValue = require('../src/transform').transformValue,
	path = require('path');

function test(input, output, opts) {
	return postcss(functions(opts)).process(input).then(function (result) {
		assert.equal(output, result.css);
	});
};

describe('postcss-functions', function () {
	it('will invoke a recognized function', function () {
		return test('a{foo:bar()}', 'a{foo:baz}', { 
			functions: {
				'bar': function () {
					return 'baz';
				}
			}
		});
	});
	it('will accept deferred functions', function () {
		return test('a{foo:bar()}', 'a{foo:baz}', {
			functions: {
				'bar': function () {
					return Promise.resolve('baz');
				}
			}
		});
	});
	it('will invoke multiple recognized functions', function () {
		return test('a{foo:bar() baz()}', 'a{foo:bat qux}', { 
			functions: {
				'bar': function () {
					return 'bat';
				},
				'baz': function () {
					return 'qux';
				}
			}
		});
	});
	it('will ignore unrecognized functions', function () {
		return test('a{foo:bar()}', 'a{foo:bar()}', {});
	});
	it('can pass arguments', function () {
		return test('a{foo:bar(qux, norf)}', 'a{foo:qux-norf}', {
			functions: {
				'bar': function (baz, bat) {
					return baz + '-' + bat;
				}
			}
		});
	});
	it('will invoke an auto-detected function from a globbed directory', function () {
		return test('a{foo:bar()}', 'a{foo:baz}', { 
			glob: path.join(__dirname, 'functions', '*.js')
		});
	});
	it('can invoke a function in an @-rule', function () {
		return test('@foo bar(){bat:qux}', '@foo baz{bat:qux}', { 
			functions: {
				'bar': function () {
					return 'baz';
				}
			}
		});
	});
	it('should invoke nested functions', function () {
		return test('a{foo:bar(baz())}', 'a{foo:parpaz}', {
			functions: {
				'bar': function (arg) {
					return 'par' + arg;
				},
				'baz': function () {
					return 'paz';
				}
			}
		})
	});
	it('should not pass empty arguments', function () {
		return postcss(functions({
			functions: {
				'bar': function () {
					assert.equal(arguments.length, 0);
				}
			}
		})).process('a{foo:bar()}');
	})
	it('should avoid creating promises if possible', function () {
		var functions = {
			'fooPromise': function () {
				return Promise.resolve('foo');
			},
			'barNoPromise': function () {
				return 'bar';
			}
		};

		// With promise
		assert(isPromise(transformValue('fooPromise()', functions)));
		assert(isPromise(transformValue('barNoPromise(fooPromise())', functions)));

		// Without promise
		assert(!isPromise(transformValue('barNoPromise()', functions)));
	})
});
