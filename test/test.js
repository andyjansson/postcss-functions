var assert = require('assert'),
	postcss = require('postcss'),
	functions = require('../'),
	path = require('path');

var test = function (input, output, opts) {
	var result = postcss(functions(opts)).process(input).css;
	assert.equal(output, result);
};

describe('postcss-functions', function () {
	it('will invoke a recognized function', function () {
		test('a{foo:bar()}','a{foo:baz}', { 
			functions: {
				'bar': function () {
					return 'baz';
				}
			}
		});
	});
	it('will invoke multiple recognized functions', function () {
		test('a{foo:bar() baz()}','a{foo:bat qux}', { 
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
		test('a{foo:bar()}','a{foo:bar()}', {});
	});
	it('can pass arguments', function () {
		test('a{foo:bar(qux, norf)}', 'a{foo:qux-norf}', {
			functions: {
				'bar': function (baz, bat) {
					return baz + '-' + bat;
				}
			}
		});
	});
	it('will invoke an auto-detected function from a globbed directory', function () {
		test('a{foo:bar()}','a{foo:baz}', { 
			glob: path.join(__dirname, 'functions', '*.js')
		});
	});
	it('can invoke a function in an @-rule', function () {
		test('@foo bar(){bat:qux}','@foo baz{bat:qux}', { 
			functions: {
				'bar': function () {
					return 'baz';
				}
			}
		});
	});
});