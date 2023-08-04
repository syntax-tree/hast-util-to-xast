/**
 * @typedef {import('hast').Comment} HastComment
 * @typedef {import('hast').Doctype} HastDoctype
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').Nodes} HastNodes
 * @typedef {import('hast').Root} HastRoot
 * @typedef {import('hast').Text} HastText
 *
 * @typedef {import('property-information').Schema} Schema
 *
 * @typedef {import('xast').Attributes} XastAttributes
 * @typedef {import('xast').Comment} XastComment
 * @typedef {import('xast').Doctype} XastDoctype
 * @typedef {import('xast').Element} XastElement
 * @typedef {import('xast').ElementContent} XastElementContent
 * @typedef {import('xast').Nodes} XastNodes
 * @typedef {import('xast').Root} XastRoot
 * @typedef {import('xast').RootContent} XastRootContent
 * @typedef {import('xast').Text} XastText
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {Space | null | undefined} [space='html']
 *   Which space the document is in (default: `'html'`).
 *
 *   When an `<svg>` element is found in the HTML space, this package already
 *   automatically switches to and from the SVG space when entering and exiting
 *   it.
 *
 *   You can also switch explicitly with `xmlns` properties in hast, but note
 *   that only HTML and SVG are supported.
 *
 * @typedef {'html' | 'svg'} Space
 *   Namespace.
 *
 * @typedef State
 *   Info passed around about the current state.
 * @property {string | undefined} ns
 *   Namespace.
 * @property {Schema} schema
 *   Current schema.
 */

import {stringify as commas} from 'comma-separated-tokens'
import {find, html, svg} from 'property-information'
import {stringify as spaces} from 'space-separated-tokens'
import {position} from 'unist-util-position'
import {webNamespaces} from 'web-namespaces'
import {zwitch} from 'zwitch'

/** @type {Options} */
const emptyOptions = {}

const own = {}.hasOwnProperty

/** @type {(node: HastNodes, state: State) => XastNodes} */
const one = zwitch('type', {
  handlers: {root, element, text, comment, doctype},
  invalid,
  unknown
})

/**
 * Turn a hast tree into a xast tree.
 *
 * @param {HastNodes} tree
 *   hast tree to transform.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {XastNodes}
 *   xast tree.
 */
export function toXast(tree, options) {
  const settings = options || emptyOptions

  return one(tree, {
    schema: settings.space === 'svg' ? svg : html,
    ns: undefined
  })
}

/**
 * Throw on an invalid value in the tree.
 *
 * @param {unknown} value
 *   Non-node.
 * @returns {never}
 *   Never.
 */
function invalid(value) {
  throw new Error('Expected node, not `' + value + '`')
}

/**
 * Throw on an unknown node in the tree.
 *
 * @param {unknown} value
 *   Unknown node.
 * @returns {never}
 *   Never.
 */
function unknown(value) {
  // @ts-expect-error `type` guaranteed
  throw new Error('Cannot transform node of type `' + value.type + '`')
}

/**
 * Transform a hast root to a xast root.
 *
 * @param {HastRoot} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {XastRoot}
 *   xast node.
 */
function root(node, state) {
  /** @type {Array<XastRootContent>} */
  const children = []
  let index = -1

  while (++index < node.children.length) {
    const child = node.children[index]
    const result = /** @type {XastRootContent} */ (one(child, state))
    children[index] = result
  }

  /** @type {XastRoot} */
  const result = {type: 'root', children}
  patch(node, result)
  return result
}

/**
 * Transform a hast text to a xast text.
 *
 * @param {HastText} node
 *   hast node to transform.
 * @param {State} _
 *   Info passed around about the current state.
 * @returns {XastText}
 *   xast node.
 */
function text(node, _) {
  /** @type {XastText} */
  const result = {type: 'text', value: node.value || ''}
  patch(node, result)
  return result
}

/**
 * Transform a hast comment to a xast comment.
 *
 * @param {HastComment} node
 *   hast node to transform.
 * @param {State} _
 *   Info passed around about the current state.
 * @returns {XastComment}
 *   xast node.
 */
function comment(node, _) {
  /** @type {XastComment} */
  const result = {type: 'comment', value: node.value || ''}
  patch(node, result)
  return result
}

/**
 * Transform a hast doctype to a xast doctype.
 *
 * @param {HastDoctype} node
 *   hast node to transform.
 * @param {State} _
 *   Info passed around about the current state.
 * @returns {XastDoctype}
 *   xast node.
 */
function doctype(node, _) {
  /** @type {XastDoctype} */
  const result = {
    type: 'doctype',
    name: 'html',
    public: undefined,
    system: undefined
  }
  patch(node, result)
  return result
}

/**
 * Transform a hast element to a xast element.
 *
 * @param {HastElement} node
 *   hast node to transform.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {XastElement}
 *   xast node.
 */
// eslint-disable-next-line complexity
function element(node, state) {
  const props = node.properties || {}
  let schema = state.schema
  /** @type {XastAttributes} */
  const attributes = {}

  if (props.xmlns === webNamespaces.html) {
    schema = html
  } else if (props.xmlns === webNamespaces.svg) {
    schema = svg
  } else if (props.xmlns) {
    // We don’t support non-HTML, non-SVG namespaces, so stay in the same.
  } else if (schema === html && node.tagName === 'svg') {
    schema = svg
  }

  /** @type {State} */
  const childState = Object.assign({}, state, {
    schema,
    // @ts-expect-error: `schema.space` is set because html, svg have it set.
    ns: webNamespaces[schema.space]
  })

  if (state.ns !== childState.ns) {
    attributes.xmlns = childState.ns
  }

  /** @type {string} */
  let key

  for (key in props) {
    if (own.call(props, key)) {
      const info = find(schema, key)
      let value = props[key]

      // Ignore nullish, false, and `NaN` values, and falsey known booleans.
      if (
        (typeof value === 'number' && Number.isNaN(value)) ||
        (!value && info.boolean) ||
        value === false ||
        value === null ||
        value === undefined
      ) {
        continue
      }

      // Treat `true` and truthy known booleans.
      if (value === true || info.boolean) {
        value = ''
      }
      // Accept `array`.
      // Most props are space-separated.
      else if (Array.isArray(value)) {
        value = info.commaSeparated ? commas(value) : spaces(value)
      }
      // Cast everything else to string.
      else if (typeof value !== 'string') {
        value = String(value)
      }

      attributes[info.attribute] = value
    }
  }

  /** @type {Array<XastElementContent>} */
  const children = []
  let index = -1

  if (
    childState.schema === html &&
    node.tagName === 'template' &&
    node.content
  ) {
    const results = /** @type {Array<XastElementContent>} */ (
      root(node.content, childState).children
    )
    children.push(...results)
  } else {
    while (++index < node.children.length) {
      const child = node.children[index]
      const result = /** @type {XastElementContent} */ (one(child, childState))
      children[index] = result
    }
  }

  /** @type {XastElement} */
  const result = {
    type: 'element',
    name: node.tagName,
    attributes,
    children
  }
  patch(node, result)
  return result
}

/**
 * @param {HastNodes} origin
 *   hast node.
 * @param {XastNodes} node
 *   xast node.
 * @returns {undefined}
 *   Nothing.
 */
function patch(origin, node) {
  if (origin.position) node.position = position(origin)
}
