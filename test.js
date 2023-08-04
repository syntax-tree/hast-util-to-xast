/**
 * @typedef {import('mdast-util-to-hast')}
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {h, s} from 'hastscript'
import {toXast} from 'hast-util-to-xast'
import {u} from 'unist-builder'
import {webNamespaces} from 'web-namespaces'
import {x} from 'xastscript'

test('main', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('hast-util-to-xast')).sort(), [
      'toXast'
    ])
  })

  await t.test('should throw without node', async function () {
    assert.throws(function () {
      // @ts-expect-error: check how the runtime handles a missing node.
      toXast()
    }, /Error: Expected node, not `undefined`/)
  })

  await t.test('should throw if a node cannot be handled', async function () {
    assert.throws(function () {
      toXast({type: 'raw', value: '<script>alert(1)</script>'})
    }, /Error: Cannot transform node of type `raw`/)
  })

  await t.test('should support html', async function () {
    assert.deepEqual(toXast(h('div')), x('div', {xmlns: webNamespaces.html}))
  })

  await t.test('should support `options.space` (svg)', async function () {
    assert.deepEqual(
      toXast(s('rect'), {space: 'svg'}),
      x('rect', {xmlns: webNamespaces.svg})
    )
  })

  await t.test('should support `space` (svg)', async function () {
    assert.deepEqual(
      toXast(s('circle'), {space: 'svg'}),
      x('circle', {xmlns: webNamespaces.svg})
    )
  })

  await t.test('should support positional information', async function () {
    assert.deepEqual(
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
          start: {line: 1, column: 1, offset: undefined},
          end: {line: 1, column: 4, offset: undefined}
        }
      }
    )
  })
})

test('root', async function (t) {
  await t.test('should support a root node', async function () {
    assert.deepEqual(
      toXast(u('root', [h('div', 'Alpha')])),
      u('root', [x('div', {xmlns: webNamespaces.html}, 'Alpha')])
    )
  })
})

test('text', async function (t) {
  await t.test('should support a text node', async function () {
    assert.deepEqual(toXast(u('text', 'Alpha')), u('text', 'Alpha'))
  })

  await t.test('should support a void text node', async function () {
    assert.deepEqual(
      toXast(
        // @ts-expect-error: check how the runtime handles a missing `value` field.
        {type: 'text'}
      ),
      u('text', '')
    )
  })
})

test('comment', async function (t) {
  await t.test('should support a comment node', async function () {
    assert.deepEqual(toXast(u('comment', 'Alpha')), u('comment', 'Alpha'))
  })

  await t.test('should support a void comment node', async function () {
    assert.deepEqual(
      toXast(
        // @ts-expect-error: check how the runtime handles a missing `value` field.
        {type: 'comment'}
      ),
      u('comment', '')
    )
  })
})

test('doctype', async function (t) {
  await t.test('should support a doctype node', async function () {
    assert.deepEqual(
      toXast(u('doctype')),
      u('doctype', {name: 'html', public: undefined, system: undefined})
    )
  })
})

test('element', async function (t) {
  await t.test('should support elements', async function () {
    assert.deepEqual(
      toXast(h('p', [h('a', 'A'), ' & ', h('b', 'B'), '.'])),
      x('p', {xmlns: webNamespaces.html}, [
        x('a', 'A'),
        ' & ',
        x('b', 'B'),
        '.'
      ])
    )
  })

  await t.test('should support template elements', async function () {
    assert.deepEqual(
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
      x('template', {xmlns: webNamespaces.html}, [
        x('p', [x('b', 'Bold'), ' and ', x('i', 'italic'), '.'])
      ])
    )
  })

  await t.test('should support attributes', async function () {
    assert.deepEqual(
      toXast(h('p#a.b.c', {ariaLabel: 'd', dataE: 'f'}, 'Alpha')),
      x(
        'p',
        {
          xmlns: webNamespaces.html,
          id: 'a',
          class: 'b c',
          'aria-label': 'd',
          'data-e': 'f'
        },
        ['Alpha']
      )
    )
  })
})

test('attributes', async function (t) {
  await t.test(
    'should not fail for elements without properties',
    async function () {
      assert.deepEqual(
        toXast(
          // @ts-expect-error: check how the runtime handles a missing `properties` field.
          {type: 'element', tagName: 'br', children: []}
        ),
        x('br', {xmlns: webNamespaces.html})
      )
    }
  )

  await t.test('should support attribute values: `null`', async function () {
    assert.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: null}}, [])),
      x('br', {xmlns: webNamespaces.html})
    )
  })

  await t.test(
    'should support attribute values: `undefined`',
    async function () {
      assert.deepEqual(
        toXast(
          u('element', {tagName: 'br', properties: {prop: undefined}}, [])
        ),
        x('br', {xmlns: webNamespaces.html})
      )
    }
  )

  await t.test('should support attribute values: `NaN`', async function () {
    assert.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: Number.NaN}}, [])),
      x('br', {xmlns: webNamespaces.html})
    )
  })

  await t.test('should support attribute values: `false`', async function () {
    assert.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: false}}, [])),
      x('br', {xmlns: webNamespaces.html})
    )
  })

  await t.test('should support attribute values: `true`', async function () {
    assert.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: true}}, [])),
      x('br', {xmlns: webNamespaces.html, prop: ''})
    )
  })

  await t.test(
    'should support known falsey boolean attribute values',
    async function () {
      assert.deepEqual(
        toXast(u('element', {tagName: 'script', properties: {async: 0}}, [])),
        x('script', {xmlns: webNamespaces.html})
      )
    }
  )

  await t.test('should support numeric attribute values', async function () {
    assert.deepEqual(
      toXast(u('element', {tagName: 'br', properties: {prop: 1.2}}, [])),
      x('br', {xmlns: webNamespaces.html, prop: '1.2'})
    )
  })

  await t.test(
    'should support known space-separated attribute values',
    async function () {
      assert.deepEqual(
        toXast(
          u('element', {tagName: 'br', properties: {className: ['a', 'b']}}, [])
        ),
        x('br', {xmlns: webNamespaces.html, class: 'a b'})
      )
    }
  )

  await t.test(
    'should support known comma-separated attribute values',
    async function () {
      assert.deepEqual(
        toXast(
          u('element', {tagName: 'br', properties: {accept: ['a', 'b']}}, [])
        ),
        x('br', {xmlns: webNamespaces.html, accept: 'a, b'})
      )
    }
  )

  await t.test(
    'should support attributes in the xml space (1)',
    async function () {
      assert.deepEqual(
        toXast(u('element', {tagName: 'br', properties: {xmlLang: 'en'}}, [])),
        x('br', {xmlns: webNamespaces.html, 'xml:lang': 'en'})
      )
    }
  )

  await t.test(
    'should support attributes in the xml space (2)',
    async function () {
      assert.deepEqual(
        toXast(
          u('element', {tagName: 'svg', properties: {xmlSpace: 'preserve'}}, [])
        ),
        x('svg', {xmlns: webNamespaces.svg, 'xml:space': 'preserve'})
      )
    }
  )

  await t.test(
    'should support attributes in the xmlns space',
    async function () {
      assert.deepEqual(
        toXast(
          u(
            'element',
            {tagName: 'svg', properties: {xmlnsXLink: webNamespaces.xlink}},
            []
          )
        ),
        x('svg', {xmlns: webNamespaces.svg, 'xmlns:xlink': webNamespaces.xlink})
      )
    }
  )

  await t.test(
    'should support attributes in the xlink space',
    async function () {
      assert.deepEqual(
        toXast(
          u(
            'element',
            {
              tagName: 'use',
              properties: {
                x: 5,
                y: 5,
                xmlnsXLink: webNamespaces.xlink,
                xLinkHref: '#a'
              }
            },
            []
          ),
          {space: 'svg'}
        ),
        x('use', {
          xmlns: webNamespaces.svg,
          x: '5',
          y: '5',
          'xmlns:xlink': webNamespaces.xlink,
          'xlink:href': '#a'
        })
      )
    }
  )

  await t.test('should include random prefixes', async function () {
    assert.deepEqual(
      toXast(
        u('element', {tagName: 'x', properties: {'alpha:bravo': 'charlie'}}, [])
      ),
      x('x', {xmlns: webNamespaces.html, 'alpha:bravo': 'charlie'})
    )
  })

  await t.test(
    'should include undefined prefixed attributes',
    async function () {
      assert.deepEqual(
        toXast(
          u(
            'element',
            {tagName: 'x', properties: {xLinkHref: '#a', xLinkTitle: 'b'}},
            []
          )
        ),
        x('x', {
          xmlns: webNamespaces.html,
          'xlink:href': '#a',
          'xlink:title': 'b'
        })
      )
    }
  )
})

test('aria', async function (t) {
  await t.test('should support aria', async function () {
    assert.deepEqual(
      toXast(
        h('a', {ariaHidden: 'true', href: '#lorem-ipsum'}, [
          h('span.icon.icon-link')
        ])
      ),
      x(
        'a',
        {
          xmlns: webNamespaces.html,
          'aria-hidden': 'true',
          href: '#lorem-ipsum'
        },
        [x('span', {class: 'icon icon-link'})]
      )
    )
  })
})

test('svg', async function (t) {
  await t.test('should support svg', async function () {
    assert.deepEqual(
      toXast(
        s(
          'svg',
          {
            xmlns: webNamespaces.svg,
            xmlnsXLink: webNamespaces.xlink,
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
          xmlns: webNamespaces.svg,
          'xmlns:xlink': webNamespaces.xlink,
          width: '500',
          height: '500',
          viewBox: '0 0 500 500'
        },
        [
          x('title', 'SVG `<circle>` element'),
          x('circle', {cx: '120', cy: '120', r: '100'})
        ]
      )
    )
  })

  await t.test('should support svg in html', async function () {
    assert.deepEqual(
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
        x('html', {xmlns: webNamespaces.html}, [
          x('head', [x('title', 'The SVG `<circle>` element')]),
          x('body', [
            x('svg', {xmlns: webNamespaces.svg, viewBox: '0 0 500 500'}, [
              x('circle', {cx: '120', cy: '120', r: '100'})
            ])
          ])
        ])
      ])
    )
  })

  await t.test('should support html in svg in html', async function () {
    assert.deepEqual(
      toXast(
        u('root', [
          u('doctype', {name: 'html'}),
          h('html', [
            h('head', h('title', 'The SVG `<foreignObject>` element')),
            h('body', [
              s('svg', {width: 800, height: 500}, [
                s('foreignObject', {x: 40, y: 20, width: 200, height: 300}, [
                  h('body', {xmlns: webNamespaces.html}, [
                    h('div', 'Lorem ipsum.')
                  ])
                ])
              ])
            ])
          ])
        ])
      ),
      u('root', [
        u('doctype', {name: 'html', public: undefined, system: undefined}),
        x('html', {xmlns: webNamespaces.html}, [
          x('head', [x('title', 'The SVG `<foreignObject>` element')]),
          x('body', [
            x('svg', {xmlns: webNamespaces.svg, width: '800', height: '500'}, [
              x(
                'foreignObject',
                {x: '40', y: '20', width: '200', height: '300'},
                [
                  x('body', {xmlns: webNamespaces.html}, [
                    x('div', 'Lorem ipsum.')
                  ])
                ]
              )
            ])
          ])
        ])
      ])
    )
  })
})

test('mathml', async function (t) {
  await t.test('should *not really* support mathml', async function () {
    assert.deepEqual(
      toXast(
        u('element', {tagName: 'p', properties: {}}, [
          u(
            'element',
            {tagName: 'math', properties: {xmlns: webNamespaces.mathml}},
            [
              u('element', {tagName: 'mi', properties: {}}, [u('text', 'x')]),
              u('element', {tagName: 'mo', properties: {}}, [u('text', '=')]),
              u('element', {tagName: 'mfrac', properties: {form: 'prefix'}}, [])
            ]
          )
        ])
      ),
      x('p', {xmlns: webNamespaces.html}, [
        x('math', {xmlns: webNamespaces.mathml}, [
          x('mi', 'x'),
          x('mo', '='),
          x('mfrac', {form: 'prefix'})
        ])
      ])
    )
  })
})
