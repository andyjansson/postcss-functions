# postcss-functions [![Build Status][ci-img]][ci]

[PostCSS] plugin for exposing JavaScript functions.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/andyjansson/postcss-functions.svg
[ci]:      https://travis-ci.org/andyjansson/postcss-functions

## Installation

```js
npm install postcss-functions
```

## Usage

```js
var fs = require('fs');
var postcss = require('postcss');
var functions = require('postcss-functions');

var options = {
	//options
};

var css = fs.readFileSync('input.css', 'utf8');

var output = postcss()
  .use(functions(options))
  .process(css)
  .css;
```

**Example** of a function call:

```css
body {
	prop: foobar();
}
```

## Options

### `functions`

Type: `Object`

An object containing functions. The function name will correspond with the object key.

```js
require('postcss-functions')({
	functions: {
		foo: function () {
			return 'bar';
		}
	}
});
```


### `glob`

Type: `string|string[]`

Loads files as functions based on one or more glob patterns. The function name will correspond with the file name. 

```js
require('postcss-functions')({
	glob: path.join(__dirname', 'functions', '*.js')
});
```
