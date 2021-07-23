/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('hast').Root} HastRoot
 * @typedef {import('hast').DocType} HastDoctype
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').Comment} HastComment
 * @typedef {import('hast').Text} HastText
 * @typedef {import('hast').Properties[string]} HastPropertyValue
 * @typedef {import('property-information').html['property'][string]} Info
 * @typedef {import('xast').Root} BaseXastRoot
 * @typedef {import('xast').Element} XastElement
 * @typedef {import('xast').Text} XastText
 * @typedef {import('xast').Comment} XastComment
 * @typedef {import('xast').Doctype} XastDoctype
 * @typedef {import('xast').Attributes} XastAttributes
 * @typedef {import('xast').RootChildMap} RootChildMap
 * @typedef {HastRoot|HastDoctype|HastElement|HastComment|HastText} HastNode
 * @typedef {BaseXastRoot & {children: Array<XastElement|XastText|XastComment|XastDoctype>}} XastRoot
 * @typedef {XastRoot|XastElement|XastText|XastComment|XastDoctype} XastNode
 *
 * @typedef {'html'|'svg'} Space
 * @typedef Options
 * @property {Space} [space]
 *
 * @typedef {html|svg} Schema
 * @typedef {webNamespaces[Space]} Namespace
 *
 * @typedef Context
 * @property {Schema} schema
 * @property {Namespace} ns
 */

import {stringify as commas} from 'comma-separated-tokens'
import {stringify as spaces} from 'space-separated-tokens'
import {html, svg, find} from 'property-information'
import {position} from 'unist-util-position'
import {webNamespaces} from 'web-namespaces'
import {zwitch} from 'zwitch'

var own = {}.hasOwnProperty

var one = zwitch('type', {
  handlers: {root, element, text, comment, doctype},
  invalid,
  unknown
})

/**
 * @param {unknown} value
 */
function invalid(value) {
  throw new Error('Expected node, not `' + value + '`')
}

/**
 * @param {Node} value
 */
function unknown(value) {
  throw new Error('Cannot transform node of type `' + value.type + '`')
}

/**
 * @param {HastNode} tree
 * @param {Space|Options} [options]
 */
export function toXast(tree, options) {
  var space = typeof options === 'string' ? options : (options || {}).space
  // @ts-ignore types are wrong.
  return one(tree, {schema: space === 'svg' ? svg : html, ns: null})
}

/**
 * @param {HastRoot} node
 * @param {Context} config
 * @returns {XastRoot}
 */
function root(node, config) {
  return patch(node, {type: 'root', children: all(node, config)})
}

/**
 * @param {HastText} node
 * @returns {XastText}
 */
function text(node) {
  return patch(node, {type: 'text', value: node.value || ''})
}

/**
 * @param {HastComment} node
 * @returns {XastComment}
 */
function comment(node) {
  return patch(node, {type: 'comment', value: node.value || ''})
}

/**
 * @param {HastDoctype} node
 * @returns {XastDoctype}
 */
function doctype(node) {
  return patch(node, {
    type: 'doctype',
    name: 'html',
    public: undefined,
    system: undefined
  })
}

/**
 * @param {HastElement} node
 * @param {Context} parentConfig
 * @returns {XastElement}
 */
// eslint-disable-next-line complexity
function element(node, parentConfig) {
  var props = node.properties || {}
  var schema = parentConfig.schema
  /** @type {XastAttributes} */
  var attributes = {}
  /** @type {Context} */
  var config
  /** @type {HastPropertyValue} */
  var value
  /** @type {string} */
  var key
  /** @type {Info} */
  var info

  if (props.xmlns === webNamespaces.html) {
    schema = html
  } else if (props.xmlns === webNamespaces.svg) {
    schema = svg
  } else if (props.xmlns) {
    // We don’t support non-HTML, non-SVG namespaces, so stay in the same.
  } else if (schema === html && node.tagName === 'svg') {
    schema = svg
  }

  config = Object.assign({}, parentConfig, {
    schema,
    ns: webNamespaces[schema.space]
  })

  if (parentConfig.ns !== config.ns) {
    attributes.xmlns = config.ns
  }

  for (key in props) {
    /* c8 ignore next 3 */
    if (!own.call(props, key)) {
      continue
    }

    info = find(schema, key)
    value = props[key]

    // Ignore nullish, false, and `NaN` values, and falsey known booleans.
    if (
      value === undefined ||
      value === null ||
      value === false ||
      (typeof value === 'number' && Number.isNaN(value)) ||
      (!value && info.boolean)
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

  // @ts-ignore Assume no `doctypes` in `element.`
  return patch(
    node,
    /** @type {XastElement} */ ({
      type: 'element',
      name: node.tagName,
      attributes,
      children: all(node, config)
    })
  )
}

/**
 * @param {HastRoot|HastElement} origin
 * @param {Context} config
 * @returns {Array.<XastElement|XastText|XastComment|XastDoctype>}
 */
function all(origin, config) {
  /** @type {Array.<XastElement|XastText|XastComment|XastDoctype>} */
  var result = []
  var index = -1

  if (
    config.schema === html &&
    origin.type === 'element' &&
    origin.tagName === 'template' &&
    origin.content
  ) {
    return root(origin.content, config).children
  }

  while (++index < origin.children.length) {
    // @ts-ignore `zwitch` types are wrong.
    result[index] = one(origin.children[index], config)
  }

  return result
}

/**
 * @template {XastNode} X
 * @param {HastNode} origin
 * @param {X} node
 * @returns {X}
 */
function patch(origin, node) {
  if (origin.position) node.position = position(origin)

  return node
}
