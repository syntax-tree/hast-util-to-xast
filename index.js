'use strict'

module.exports = toXast

var comma = require('comma-separated-tokens')
var html = require('property-information/html')
var svg = require('property-information/svg')
var find = require('property-information/find')
var space = require('space-separated-tokens')
var position = require('unist-util-position')
var namespaces = require('web-namespaces')
var xtend = require('xtend')
var zwitch = require('zwitch')

var one = zwitch('type', {
  handlers: {
    root: root,
    element: element,
    text: text,
    comment: comment,
    doctype: doctype
  },
  invalid: invalid,
  unknown: unknown
})

function invalid(value) {
  throw new Error('Expected node, not `' + value + '`')
}

function unknown(value) {
  throw new Error('Cannot transform node of type `' + value.type + '`')
}

function toXast(tree, options) {
  var space = typeof options === 'string' ? options : (options || {}).space
  return one(tree, {schema: space === 'svg' ? svg : html, ns: null})
}

function root(node, config) {
  return patch(node, {type: 'root'}, config)
}

function text(node, config) {
  return patch(node, {type: 'text', value: node.value || ''}, config)
}

function comment(node, config) {
  return patch(node, {type: 'comment', value: node.value || ''}, config)
}

function doctype(node, config) {
  return patch(
    node,
    {
      type: 'doctype',
      name: node.name || '',
      public: node.public,
      system: node.system
    },
    config
  )
}

function element(node, parentConfig) {
  var props = node.properties || {}
  var schema = parentConfig.schema
  var attributes = {}
  var config
  var value
  var key
  var info

  if (props.xmlns === namespaces.html) {
    schema = html
  } else if (props.xmlns === namespaces.svg) {
    schema = svg
  } else if (props.xmlns) {
    // We don’t support non-HTML, non-SVG namespaces, so stay in the same.
  } else if (schema === html && node.tagName === 'svg') {
    schema = svg
  }

  config = xtend(parentConfig, {schema: schema, ns: namespaces[schema.space]})

  if (parentConfig.ns !== config.ns) {
    attributes.xmlns = config.ns
  }

  for (key in props) {
    info = find(schema, key)
    value = props[key]

    // Ignore nullish, false, and `NaN` values, and falsey known booleans.
    if (
      value == null ||
      value === false ||
      value !== value ||
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
    else if (typeof value === 'object' && 'length' in value) {
      value = info.commaSeparated
        ? comma.stringify(value)
        : space.stringify(value)
    }
    // Cast everything else to string.
    else if (typeof value !== 'string') {
      value = String(value)
    }

    attributes[info.attribute] = value
  }

  return patch(
    node,
    {type: 'element', name: node.tagName, attributes: attributes},
    config
  )
}

function patch(origin, node, config) {
  var index

  if (
    config.schema === html &&
    origin.type === 'element' &&
    origin.tagName === 'template'
  ) {
    node.children = root(origin.content, config).children
  } else if (
    origin.children &&
    (origin.type === 'element' || origin.type === 'root')
  ) {
    node.children = []
    index = -1

    while (++index < origin.children.length) {
      node.children[index] = one(origin.children[index], config)
    }
  }

  if (origin.position) {
    node.position = position(origin)
  }

  return node
}
