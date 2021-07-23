import test from 'tape'
import {webNamespaces as ns} from 'web-namespaces'
import {u} from 'unist-builder'
import h from 'hastscript'
import s from 'hastscript/svg.js'
import x from 'xastscript'
import {toXast} from './index.js'

test('toXast', (t) => {
  t.test('main', (t) => {
    t.equal(typeof toXast, 'function', 'should expose a function')

    t.throws(
      () => {
        // @ts-expect-error runtime.
        toXast()
      },
      /Error: Expected node, not `undefined`/,
      'should throw without node'
    )

    t.throws(
      () => {
        // @ts-expect-error well-known.
        toXast({type: 'raw', value: '<script>alert(1)</script>'})
      },
      /Error: Cannot transform node of type `raw`/,
      'should throw if a node cannot be handled'
    )

    t.deepEqual(
      toXast(h('div')),
      x('div', {xmlns: ns.html}),
      'should support html'
    )

    t.deepEqual(
      toXast(s('rect'), {space: 'svg'}),
      x('rect', {xmlns: ns.svg}),
      'should support `options.space` (svg)'
    )

    t.deepEqual(
      toXast(s('circle'), 'svg'),
      x('circle', {xmlns: ns.svg}),
      'should support `space` (svg)'
    )

    t.deepEqual(
      toXast({
        type: 'text',
        value: 'foo',
        position: {
          start: {line: 1, column: 1},
          end: {line: 1, column: 4}
        }
      }),
      {
        type: 'text',
        value: 'foo',
        position: {
          start: {line: 1, column: 1, offset: null},
          end: {line: 1, column: 4, offset: null}
        }
      },
      'should support positional information'
    )

    t.end()
  })

  t.test('root', (t) => {
    t.deepEqual(
      toXast(u('root', [h('div', 'Alpha')])),
      u('root', [x('div', {xmlns: ns.html}, 'Alpha')]),
      'should support a root node'
    )

    t.end()
  })

  t.test('text', (t) => {
    t.deepEqual(
      toXast(u('text', 'Alpha')),
      u('text', 'Alpha'),
      'should support a text node'
    )

    t.deepEqual(
      // @ts-expect-error runtime.
      toXast(u('text')),
      u('text', ''),
      'should support a void text node'
    )

    t.end()
  })

  t.test('comment', (t) => {
    t.deepEqual(
      toXast(u('comment', 'Alpha')),
      u('comment', 'Alpha'),
      'should support a comment node'
    )

    t.deepEqual(
      // @ts-expect-error runtime.
      toXast(u('comment')),
      u('comment', ''),
      'should support a void comment node'
    )

    t.end()
  })

  t.test('doctype', (t) => {
    t.deepEqual(
      // @ts-expect-error hast@next.
      toXast(u('doctype')),
      u('doctype', {name: 'html', public: undefined, system: undefined}),
      'should support a doctype node'
    )

    t.end()
  })

  t.test('element', (t) => {
    t.deepEqual(
      toXast(h('p', [h('a', 'A'), ' & ', h('b', 'B'), '.'])),
      x('p', {xmlns: ns.html}, [x('a', 'A'), ' & ', x('b', 'B'), '.']),
      'should support elements'
    )

    t.deepEqual(
      toXast({
        type: 'element',
        tagName: 'template',
        properties: {},
        children: [],
        content: {
          type: 'root',
          children: [h('p', [h('b', 'Bold'), ' and ', h('i', 'italic'), '.'])]
        }
      }),
      x('template', {xmlns: ns.html}, [
        x('p', [x('b', 'Bold'), ' and ', x('i', 'italic'), '.'])
      ]),
      'should support template elements'
    )

    t.deepEqual(
      toXast(h('p#a.b.c', {ariaLabel: 'd', dataE: 'f'}, 'Alpha')),
      x(
        'p',
        {
          xmlns: ns.html,
          id: 'a',
          class: 'b c',
          'aria-label': 'd',
          'data-e': 'f'
        },
        ['Alpha']
      ),
      'should support attributes'
    )

    t.end()
  })

  t.test('attributes', (t) => {
    t.deepEqual(
      toXast(u('element', {tagName: 'br'}, [])),
      x('br', {xmlns: ns.html}),
      'should not fail for elements without properties'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: null}}, [])),
      x('br', {xmlns: ns.html}),
      'should support attribute values: `null`'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: undefined}}, [])),
      x('br', {xmlns: ns.html}),
      'should support attribute values: `undefined`'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: Number.NaN}}, [])),
      x('br', {xmlns: ns.html}),
      'should support attribute values: `NaN`'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: false}}, [])),
      x('br', {xmlns: ns.html}),
      'should support attribute values: `false`'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: true}}, [])),
      x('br', {xmlns: ns.html, prop: ''}),
      'should support attribute values: `true`'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'script', properties: {async: 0}}, [])),
      x('script', {xmlns: ns.html}),
      'should support known falsey boolean attribute values'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: 1.2}}, [])),
      x('br', {xmlns: ns.html, prop: '1.2'}),
      'should support numeric attribute values'
    )

    t.deepEqual(
      toXast(
        u('element', {tagName: 'br', properties: {className: ['a', 'b']}}, [])
      ),
      x('br', {xmlns: ns.html, class: 'a b'}),
      'should support known space-separated attribute values'
    )

    t.deepEqual(
      toXast(
        u('element', {tagName: 'br', properties: {accept: ['a', 'b']}}, [])
      ),
      x('br', {xmlns: ns.html, accept: 'a, b'}),
      'should support known comma-separated attribute values'
    )

    t.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {xmlLang: 'en'}}, [])),
      x('br', {xmlns: ns.html, 'xml:lang': 'en'}),
      'should support attributes in the xml space (1)'
    )

    t.deepEqual(
      toXast(
        u('element', {tagName: 'svg', properties: {xmlSpace: 'preserve'}}, [])
      ),
      x('svg', {xmlns: ns.svg, 'xml:space': 'preserve'}),
      'should support attributes in the xml space (2)'
    )

    t.deepEqual(
      toXast(
        u('element', {tagName: 'svg', properties: {xmlnsXLink: ns.xlink}}, [])
      ),
      x('svg', {xmlns: ns.svg, 'xmlns:xlink': ns.xlink}),
      'should support attributes in the xmlns space'
    )

    t.deepEqual(
      toXast(
        u(
          'element',
          {
            tagName: 'use',
            properties: {x: 5, y: 5, xmlnsXLink: ns.xlink, xLinkHref: '#a'}
          },
          []
        ),
        'svg'
      ),
      x('use', {
        xmlns: ns.svg,
        x: '5',
        y: '5',
        'xmlns:xlink': ns.xlink,
        'xlink:href': '#a'
      }),
      'should support attributes in the xlink space'
    )

    t.deepEqual(
      toXast(
        u('element', {tagName: 'x', properties: {'alpha:bravo': 'charlie'}}, [])
      ),
      x('x', {xmlns: ns.html, 'alpha:bravo': 'charlie'}),
      'should include random prefixes'
    )

    t.deepEqual(
      toXast(
        u(
          'element',
          {tagName: 'x', properties: {xLinkHref: '#a', xLinkTitle: 'b'}},
          []
        )
      ),
      x('x', {
        xmlns: ns.html,
        'xlink:href': '#a',
        'xlink:title': 'b'
      }),
      'should include undefined prefixed attributes'
    )

    t.end()
  })

  t.test('svg', (t) => {
    t.deepEqual(
      toXast(
        s(
          'svg',
          {
            xmlns: ns.svg,
            xmlnsXLink: ns.xlink,
            width: 500,
            height: 500,
            viewBox: [0, 0, 500, 500]
          },
          [
            s('title', 'SVG `<circle>` element'),
            s('circle', {cx: 120, cy: 120, r: 100})
          ]
        )
      ),
      x(
        'svg',
        {
          xmlns: ns.svg,
          'xmlns:xlink': ns.xlink,
          width: '500',
          height: '500',
          viewBox: '0 0 500 500'
        },
        [
          x('title', 'SVG `<circle>` element'),
          x('circle', {cx: '120', cy: '120', r: '100'})
        ]
      ),
      'should support svg'
    )

    t.deepEqual(
      toXast(
        u('root', [
          u('doctype', {name: 'html'}),
          h('html', [
            h('head', h('title', 'The SVG `<circle>` element')),
            h('body', [
              s('svg', {viewBox: [0, 0, 500, 500]}, [
                s('circle', {cx: 120, cy: 120, r: 100})
              ])
            ])
          ])
        ])
      ),
      u('root', [
        u('doctype', {name: 'html', public: undefined, system: undefined}),
        x('html', {xmlns: ns.html}, [
          x('head', [x('title', 'The SVG `<circle>` element')]),
          x('body', [
            x('svg', {xmlns: ns.svg, viewBox: '0 0 500 500'}, [
              x('circle', {cx: '120', cy: '120', r: '100'})
            ])
          ])
        ])
      ]),
      'should support svg in html'
    )

    t.deepEqual(
      toXast(
        u('root', [
          u('doctype', {name: 'html'}),
          h('html', [
            h('head', h('title', 'The SVG `<foreignObject>` element')),
            h('body', [
              s('svg', {width: 800, height: 500}, [
                s('foreignObject', {x: 40, y: 20, width: 200, height: 300}, [
                  h('body', {xmlns: ns.html}, [h('div', 'Lorem ipsum.')])
                ])
              ])
            ])
          ])
        ])
      ),
      u('root', [
        u('doctype', {name: 'html', public: undefined, system: undefined}),
        x('html', {xmlns: ns.html}, [
          x('head', [x('title', 'The SVG `<foreignObject>` element')]),
          x('body', [
            x('svg', {xmlns: ns.svg, width: '800', height: '500'}, [
              x(
                'foreignObject',
                {x: '40', y: '20', width: '200', height: '300'},
                [x('body', {xmlns: ns.html}, [x('div', 'Lorem ipsum.')])]
              )
            ])
          ])
        ])
      ]),
      'should support html in svg in html'
    )

    t.end()
  })

  t.test('mathml', (t) => {
    t.deepEqual(
      toXast(
        u('element', {tagName: 'p', properties: {}}, [
          u('element', {tagName: 'math', properties: {xmlns: ns.mathml}}, [
            u('element', {tagName: 'mi', properties: {}}, [u('text', 'x')]),
            u('element', {tagName: 'mo', properties: {}}, [u('text', '=')]),
            u('element', {tagName: 'mfrac', properties: {form: 'prefix'}}, [])
          ])
        ])
      ),
      x('p', {xmlns: ns.html}, [
        x('math', {xmlns: ns.mathml}, [
          x('mi', 'x'),
          x('mo', '='),
          x('mfrac', {form: 'prefix'})
        ])
      ]),
      'should *not really* support mathml'
    )

    t.end()
  })

  t.end()
})
