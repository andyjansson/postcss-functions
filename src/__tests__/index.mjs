import test         from 'ava';
import postcss      from 'postcss';

import functions    from '../index.mjs'

async function testFixture(t, fixture, expected = null, opts = {}) {
    if (expected === null)
        expected = fixture

    const out = await postcss(functions(opts)).process(fixture, { from: undefined });
    t.deepEqual(out.css, expected);
}

test(
    'should invoke a recognized function',
    testFixture,
    'a{foo:bar()}',
    'a{foo:baz}',
    {
        functions: {
            'bar': function () {
                return 'baz';
            }
        }
    }
);

test(
    'should accept deferred functions',
    testFixture,
    'a{foo:bar()}',
    'a{foo:baz}',
    {
        functions: {
            'bar': function () {
                return Promise.resolve('baz');
            }
        }
    }
);

test(
    'should invoke multiple functions',
    testFixture,
    'a{foo:bar() baz()}',
    'a{foo:bat qux}',
    {
        functions: {
            'bar': function () {
                return 'bat';
            },
            'baz': function () {
                return 'qux';
            }
        }
    }
);

test(
    'should ignore unrecognized functions',
    testFixture,
    'a{foo:bar()}'
);

test(
    'should be able to pass arguments to functions',
    testFixture,
    'a{foo:bar(qux, norf)}',
    'a{foo:qux-norf}',
    {
        functions: {
            'bar': function (baz, bat) {
                return baz + '-' + bat;
            }
        }
    }
);

test(
    'should be able to pass arguments with spaces to functions',
    testFixture,
    'a{foo:bar(hello world)}',
    'a{foo:hello-world}',
    {
        functions: {
            'bar': function (baz) {
                return baz.replace(' ', '-');
            }
        }
    }
);

test(
    'should invoke a function in an at-rule',
    testFixture,
    '@foo bar(){bat:qux}',
    '@foo baz{bat:qux}',
    {
        functions: {
            'bar': function () {
                return 'baz';
            }
        }
    }
);

test(
    'should invoke a function in a rule',
    testFixture,
    'foo:nth-child(bar()){}',
    'foo:nth-child(baz){}',
    {
        functions: {
            'bar': function () {
                return 'baz';
            }
        }
    }
);

test(
    'should invoke nested functions',
    testFixture,
    'a{foo:bar(baz())}',
    'a{foo:batqux}',
    {
        functions: {
            'bar': function (arg) {
                return 'bat' + arg;
            },
            'baz': function () {
                return Promise.resolve('qux');
            }
        }
    }
);

test(
    'should not pass empty arguments',
    t => {
		return postcss(functions({
			functions: {
				'bar': function () {
					t.deepEqual(arguments.length, 0);
				}
			}
        })).process('a{foo:bar()}', { from: undefined });
    }
);
