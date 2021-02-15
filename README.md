# @eik/rollup-plugin

Plugin to rewrite bare imports to URLs as defined in import maps

Rollup [Eik](https://eik.dev/) plugin to support the use of import maps to map "bare" import specifiers in ES modules.

## Installation

```bash
$ npm install @eik/rollup-plugin-import-map
```

## Usage

```js
import plugin from "@eik/rollup-plugin";

export default {
  input: "source/main.js",
  plugins: [plugin()],
  output: {
    file: "build.js",
    format: "esm",
  },
};
```

## Description

This plugin transforms "bare" import specifiers to absolute URL specifiers in
ES modules. The module refered to by the "bare" import specifier will be
treated as external and its source will not be included in the bundle but
refered to by URL.

The plugin will attempt to read import map URLs from `eik.json` if present.

```js
export default {
  input: "source/main.js",
  plugins: [plugin()],
  output: {
    file: "build.js",
    format: "esm",
  },
};
```

The path to the location of an `eik.json` file can be specified with the `path` option.

```js
export default {
  input: "source/main.js",
  plugins: [plugin({ path: "/path/to/eik-json-folder" })],
  output: {
    file: "build.js",
    format: "esm",
  },
};
```

The plugin can also be told which URLs to load import maps from directly using the `urls` option.

```js
export default {
  input: "source/main.js",
  plugins: [plugin({ urls: `http://myserver/import-map` })],
  output: {
    file: "build.js",
    format: "esm",
  },
};
```

Additionally, individual mappings can be specified using the `maps` option.

```js
export default {
  input: "source/main.js",
  plugins: [
    plugin({
      maps: [{
        imports: {
          "lit-element": "https://cdn.eik.dev/lit-element/v2",
        }
      }],
    }),
  ],
  output: {
    file: "build.js",
    format: "esm",
  },
};
```

If several of these options are used, `maps` takes precedence over `urls` which takes precedence over values loaded from an `eik.json` file.

ie. in the following example

```js
export default {
    input: 'source/main.js',
    plugins: [plugin({
        path: '/path/to/eik-json-folder',
        urls: ['http://myserver/import-map'],
        maps: [{
          imports: {
            "lit-element": "https://cdn.eik.dev/lit-element/v2",
          }
        }],
    })],
    output: {
        file: 'build.js',
        format: 'esm'
    }
};
```

Any import map URLs in `eik.json` will be loaded first, then merged with (and overridden if necessary by) the result of fetching from `http://myserver/import-map` before finally being merged with (and overriden if necessary by) specific mappings defined in `maps`. (In this case `lit-element`)

### Plugin result

Bundles will have bare imports mapped to absolute URLs. 

Ie. Something like this...

```js
import { LitElement, html, css } from "lit-element";
```

Will be mapped to something like this...

```js
import { LitElement, html, css } from "https://cdn.eik.dev/lit-element/v2";
```

## Options

This plugin takes an [import map](https://github.com/WICG/import-maps) as options:

| option  | default        | type     | required | details                                                     |
| ------- | -------------- | -------- | -------- | ----------------------------------------------------------- |
| path    | `cwd/eik.json` | `string` | `false`  | Path to eik.json file.                                      |
| urls    | `[]`           | `array`  | `false`  | Array of import map URLs to fetch from.                     |
| maps    | `[]`           | `array`  | `false`  | Array of import map as objects.                             |

## Note on the rollup external option

Any mappings defined by any of the means described above must not occur in the Rollup `external` option.
If so, this module will throw.

In other words, this will not work:

```js
export default {
  input: "source/main.js",
  external: ["lit-element"],
  plugins: [
    plugin({
      maps: [{
        imports: {
          "lit-element": "https://cdn.eik.dev/lit-element/v2",
        }
      }],
    }),
  ],
  output: {
    file: "build.js",
    format: "esm",
  },
};
```

## License

Copyright (c) 2021 Finn.no

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
