# hast-util-to-xast

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[hast][] (HTML) utility to transform to [xast][] (XML).

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`toXast(tree[, options])`](#toxasttree-options)
    *   [`Options`](#options)
    *   [`Space`](#space-1)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a utility that takes a [hast][] (HTML) syntax tree as input and
turns it into a [xast][] (XML) syntax tree.
This package also supports embedded MDX nodes.

## When should I use this?

This project is useful when you want to deal with ASTs, and for some reason,
*have* to deal with XML.
One example of this is for EPUB (digital books).

There is no inverse of this utility, because not all XML is HTML.

A similar package, [`hast-util-to-estree`][hast-util-to-estree], can turn
hast into estree (JavaScript) as JSX, which has some similarities to XML.

## Install

This package is [ESM only][esm].
In Node.js (version 16+), install with [npm][]:

```sh
npm install hast-util-to-xast
```

In Deno with [`esm.sh`][esmsh]:

```js
import {toXast} from "https://esm.sh/hast-util-to-xast@3"
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {toXast} from "https://esm.sh/hast-util-to-xast@3?bundle"
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

Turn a [hast][] tree into a [xast][] tree.

###### Parameters

*   `tree` ([`HastNode`][hast-node])
    — hast tree to transform
*   `options` ([`Options`][api-options], optional)
    — configuration

###### Returns

xast tree ([`XastNode`][xast-node]).

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
Use [`hast-util-santize`][hast-util-sanitize] to make the hast tree safe before
using this utility.

## Related

*   [`hastscript`](https://github.com/syntax-tree/hastscript)
    — create **[hast][]** (HTML or SVG) trees
*   [`xastscript`](https://github.com/syntax-tree/xastscript)
    — create **[xast][]** (XML) trees
*   [`xast-util-to-xml`](https://github.com/syntax-tree/xast-util-to-xml)
    — serialize as XML

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/hast-util-to-xast/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/hast-util-to-xast/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-to-xast.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-util-to-xast

[downloads-badge]: https://img.shields.io/npm/dm/hast-util-to-xast.svg

[downloads]: https://www.npmjs.com/package/hast-util-to-xast

[size-badge]: https://img.shields.io/badge/dynamic/json?label=minzipped%20size&query=$.size.compressedSize&url=https://deno.bundlejs.com/?q=hast-util-to-xast

[size]: https://bundlejs.com/?q=hast-util-to-xast

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[license]: license

[author]: https://wooorm.com

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[hast]: https://github.com/syntax-tree/hast

[hast-node]: https://github.com/syntax-tree/hast#nodes

[hast-util-sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[hast-util-to-estree]: https://github.com/syntax-tree/hast-util-to-estree

[xast]: https://github.com/syntax-tree/xast

[xast-node]: https://github.com/syntax-tree/xast#nodes

[api-to-xast]: #toxasttree-options

[api-options]: #options

[api-space]: #space-1
