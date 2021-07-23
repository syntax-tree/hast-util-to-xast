# hast-util-to-xast

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[hast][]** (HTML / SVG) utility to transform *[trees][tree]* to **[xast][]**
(XML).

## Install

This package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c):
Node 12+ is needed to use it and it must be `import`ed instead of `require`d.

[npm][]:

```sh
npm install hast-util-to-xast
```

## Use

Say we have an `example.html` file, that looks as follows:

```html
<!doctypehtml>
<title>Hello, World!</title>
<h1>👋, 🌍</h1>
```

…and our script, `example.js`, looks as follows:

```js
import fs from 'node:fs'
import {unified} from 'unified'
import rehypeParse from 'rehype-parse'
import {toXast} from 'hast-util-to-xast'
import {toXml} from 'xast-util-to-xml'

// Get the HTML syntax tree:
const hast = unified()
  .use(rehypeParse)
  .parse(fs.readFileSync('example.html'))

// Turn hast to xast:
const xast = toXast(hast)

// Serialize xast:
console.log(toXml(xast))
```

Yields:

```xml
<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Hello, World!</title>
</head><body><h1>👋, 🌍</h1>
</body></html>
```

## API

This package exports the following identifiers: `toXast`.
There is no default export.

### `toXast(node[, space|options])`

Transform the given **[hast][]** *[tree][]* to **[xast][]**.

##### `space`

Treated as `options.space`.

##### `options`

###### `options.space`

Whether the [*root*][root] of the [*tree*][tree] is in the `'html'` or `'svg'`
space (enum, `'svg'` or `'html'`, default: `'html'`).

If an `svg` element is found in the HTML space, `toXast` automatically switches
to the SVG space when entering the element, and switches back when exiting.

You can also switch explicitly with `xmlns` properties in hast, but note that
only HTML and SVG are supported.

## Security

Both HTML and XML can be a dangerous language: don’t trust user-provided data.
Use [`hast-util-santize`][sanitize] to make the hast tree safe before using this
utility.

## Related

*   [`unist-builder`][u]
    — Create any unist tree
*   [`hastscript`][h]
    — Create a **[hast][]** (HTML or SVG) tree
*   [`xastscript`][x]
    — Create a **[xast][]** (XML) tree
*   [`xast-util-to-xml`](https://github.com/syntax-tree/xast-util-to-xml)
    — Serialize nodes to XML

## Contribute

See [`contributing.md` in `syntax-tree/.github`][contributing] for ways to get
started.
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

[size-badge]: https://img.shields.io/bundlephobia/minzip/hast-util-to-xast.svg

[size]: https://bundlephobia.com/result?p=hast-util-to-xast

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[contributing]: https://github.com/syntax-tree/.github/blob/HEAD/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/HEAD/support.md

[coc]: https://github.com/syntax-tree/.github/blob/HEAD/code-of-conduct.md

[hast]: https://github.com/syntax-tree/hast

[xast]: https://github.com/syntax-tree/xast

[tree]: https://github.com/syntax-tree/unist#tree

[root]: https://github.com/syntax-tree/unist#root

[sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[u]: https://github.com/syntax-tree/unist-builder

[h]: https://github.com/syntax-tree/hastscript

[x]: https://github.com/syntax-tree/xastscript
