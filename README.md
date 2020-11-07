# postcss-functions

[PostCSS] plugin for exposing JavaScript functions.

[PostCSS]: https://github.com/postcss/postcss

## Installation

```js
npm install --save-dev postcss postcss-functions
```

## Usage

```js
import fs from 'fs';
import postcss from 'postcss';
import functions from 'postcss-functions';

const options = {
	//options
};

const css = fs.readFileSync('input.css', 'utf8');

postcss()
  .use(functions(options))
  .process(css)
  .then((result) => {
    const output = result.css;
  });
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

**Example:**

```js
import postcssFunctions from 'postcss-functions';
import { fromString, fromRgb } from 'css-color-converter';
```

```js
function darken(value, frac) {
  const darken = 1 - parseFloat(frac);
  const rgba = fromString(value).toRgbaArray();
  const r = rgba[0] * darken;
  const g = rgba[1] * darken;
  const b = rgba[2] * darken;
  return fromRgb([r,g,b]).toHexString();
}
```

```js
postcssFunctions({
  functions: { darken }
});
```

```css
.foo {
  /* make 10% darker */
  color: darken(blue, 0.1);
}
```

#### Hey, what happened to `glob`?

Versions prior to 4.0.0 had a globbing feature built in, but I've since decided to remove this feature from `postcss-functions`. This means one less dependency and a smaller package size. For people still interested in this feature, you are free to pair `postcss-functions` with the globbing library of your choice and pass the `import`ed JavaScript files to the `functions` option as described above. 
