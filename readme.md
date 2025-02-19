# hast-util-to-xast

[![Build][badge-build-image]][badge-build-url]
[![Coverage][badge-coverage-image]][badge-coverage-url]
[![Downloads][badge-downloads-image]][badge-downloads-url]
[![Size][badge-size-image]][badge-size-url]

[hast][github-hast] (HTML) utility to transform to [xast][github-xast] (XML).

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`toXast(tree[, options])`](#toxasttree-options)
  * [`Options`](#options)
  * [`Space`](#space-1)
* [Types](#types)
* [Compatibility](#compatibility)
* [Security](#security)
* [Related](#related)
* [Contribute](#contribute)
* [License](#license)

## What is this?

This package is a utility that takes a
[hast][github-hast] (HTML)
syntax tree as input and turns it into a
[xast][github-xast] (XML)
syntax tree.
This package also supports embedded MDX nodes.

## When should I use this?

This project is useful when you want to deal with ASTs, and for some reason,
*have* to deal with XML.
One example of this is for EPUB (digital books).

There is no inverse of this utility, because not all XML is HTML.

A similar package, [`hast-util-to-estree`][github-hast-util-to-estree],
can turn hast into estree (JavaScript) as JSX,
which has some similarities to XML.

## Install

This package is [ESM only][github-gist-esm].
In Node.js (version 16+), install with
[npm][npmjs-install]:

```sh
npm install hast-util-to-xast
```

In Deno with [`esm.sh`][esmsh]:

```js
import {toXast} from 'https://esm.sh/hast-util-to-xast@3'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {toXast} from 'https://esm.sh/hast-util-to-xast@3?bundle'
</script>
```

## Use

Say our document `example.html` contains:

```html
<!doctypehtml>
<title>Hello, World!</title>
<h1>👋, 🌍</h1>
```

…and our module `example.js` looks as follows:

```js
import fs from 'node:fs/promises'
import {fromHtml} from 'hast-util-from-html'
import {toXast} from 'hast-util-to-xast'
import {toXml} from 'xast-util-to-xml'

// Get the HTML syntax tree:
const hast = fromHtml(await fs.readFile('example.html'))

// Turn hast to xast:
const xast = toXast(hast)

// Serialize xast:
console.log(toXml(xast))
```

…now running `node example.js` yields:

```xml
<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Hello, World!</title>
</head><body><h1>👋, 🌍</h1>
</body></html>
```

## API

This package exports the identifier [`toXast`][api-to-xast].
There is no default export.

### `toXast(tree[, options])`

Turn a [hast][github-hast] tree into a [xast][github-xast] tree.

###### Parameters

* `tree` ([`HastNode`][github-hast-nodes])
  — hast tree to transform
* `options` ([`Options`][api-options], optional)
  — configuration

###### Returns

xast tree ([`XastNode`][github-xast-nodes]).

### `Options`

Configuration (TypeScript type).

##### Fields

###### `space`

Which space the document is in ([`Space`][api-space], default: `'html'`).

When an `<svg>` element is found in the HTML space, this package already
automatically switches to and from the SVG space when entering and exiting it.

You can also switch explicitly with `xmlns` properties in hast, but note that
only HTML and SVG are supported.

### `Space`

Namespace (TypeScript type).

###### Type

```ts
type Space = 'html' | 'svg'
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`Options`][api-options] and
[`Space`][api-space].

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `hast-util-to-xast@^3`,
compatible with Node.js 16.

## Security

Both HTML and XML can be dangerous languages: don’t trust user-provided data.
Use [`hast-util-santize`][github-hast-util-sanitize]
to make the hast tree safe before using this utility.

## Related

* [`hastscript`](https://github.com/syntax-tree/hastscript)
  — create [hast][github-hast] (HTML or SVG) trees
* [`xastscript`](https://github.com/syntax-tree/xastscript)
  — create [xast][github-xast] (XML) trees
* [`xast-util-to-xml`](https://github.com/syntax-tree/xast-util-to-xml)
  — serialize as XML

## Contribute

See [`contributing.md`][health-contributing]
in
[`syntax-tree/.github`][health]
for ways to get started.
See [`support.md`][health-support] for ways to get help.

This project has a [code of conduct][health-coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][file-license] © [Titus Wormer][wooorm]

<!-- Definitions -->

[api-options]: #options

[api-space]: #space-1

[api-to-xast]: #toxasttree-options

[badge-build-image]: https://github.com/syntax-tree/hast-util-to-xast/workflows/main/badge.svg

[badge-build-url]: https://github.com/syntax-tree/hast-util-to-xast/actions

[badge-coverage-image]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-to-xast.svg

[badge-coverage-url]: https://codecov.io/github/syntax-tree/hast-util-to-xast

[badge-downloads-image]: https://img.shields.io/npm/dm/hast-util-to-xast.svg

[badge-downloads-url]: https://www.npmjs.com/package/hast-util-to-xast

[badge-size-image]: https://img.shields.io/bundlejs/size/hast-util-to-xast

[badge-size-url]: https://bundlejs.com/?q=hast-util-to-xast

[esmsh]: https://esm.sh

[file-license]: license

[github-gist-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[github-hast]: https://github.com/syntax-tree/hast

[github-hast-nodes]: https://github.com/syntax-tree/hast#nodes

[github-hast-util-sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[github-hast-util-to-estree]: https://github.com/syntax-tree/hast-util-to-estree

[github-xast]: https://github.com/syntax-tree/xast

[github-xast-nodes]: https://github.com/syntax-tree/xast#nodes

[health]: https://github.com/syntax-tree/.github

[health-coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[health-contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[health-support]: https://github.com/syntax-tree/.github/blob/main/support.md

[npmjs-install]: https://docs.npmjs.com/cli/install

[typescript]: https://www.typescriptlang.org

[wooorm]: https://wooorm.com
