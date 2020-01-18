'use strict'

var xtend = require('xtend')
var zwitch = require('zwitch')
var namespaces = require('web-namespaces')
var html = require('property-information/html')
var svg = require('property-information/svg')
var find = require('property-information/find')
var spaces = require('space-separated-tokens').stringify
var commas = require('comma-separated-tokens').stringify
var position = require('unist-util-position')

module.exports = toXast

var one = zwitch('type')

one.invalid = invalid
one.unknown = unknown
one.handlers.root = root
one.handlers.element = element
one.handlers.text = text
one.handlers.comment = comment
one.handlers.doctype = doctype

function invalid(value) {
  throw new Error('Expected node, not `' + value + '`')
}

function unknown(value) {
  throw new Error('Cannot transform node of type `' + value.type + '`')
}

function toXast(tree, options) {
  var opts = typeof options === 'string' ? {space: options} : options || {}
  var space = opts.space === 'svg' ? 'svg' : 'html'

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
      public: node.public || undefined,
      system: node.system || undefined
    },
    config
  )
}

function element(node, parentConfig) {
  var schema = parentConfig.schema
  var name = node.tagName
  var props = node.properties || {}
  var xmlns = props.xmlns || null
  var ns = namespaces[schema.space]
  var attrs = {}
  var config

  if (xmlns) {
    if (xmlns === namespaces.svg) {
      schema = svg
      ns = xmlns
    } else if (xmlns === namespaces.html) {
      schema = html
      ns = xmlns
    } else {
      // We don’t support non-HTML, non-SVG namespaces, so stay in the same.
    }
  } else if (ns === namespaces.html && name === 'svg') {
    schema = svg
    ns = namespaces.svg
  }

  if (parentConfig.ns !== ns) {
    attrs.xmlns = ns
  }

  config = xtend(parentConfig, {schema: schema, ns: ns})
  attrs = xtend(attrs, toAttributes(props, config))

  return patch(node, {type: 'element', name: name, attributes: attrs}, config)
}

function patch(origin, node, config) {
  var pos = origin.position
  var hastChildren = origin.children
  var length
  var children
  var index

  if (
    config.ns === namespaces.html &&
    origin.type === 'element' &&
    origin.tagName === 'template'
  ) {
    node.children = root(origin.content, config).children
  } else if (origin.type === 'element' || origin.type === 'root') {
    length = hastChildren && hastChildren.length
    children = []
    index = -1

    while (++index < length) {
      children[index] = one(hastChildren[index], config)
    }

    node.children = children
  }

  if (pos) {
    node.position = {
      start: position.start(origin),
      end: position.end(origin)
    }
  }

  return node
}

function toAttributes(props, config) {
  var attributes = {}
  var value
  var key
  var info
  var name

  for (key in props) {
    info = find(config.schema, key)
    name = info.attribute
    value = props[key]

    // Ignore nully, false, and `NaN` values, and falsey known booleans.
    if (
      value === null ||
      value === undefined ||
      value === false ||
      value !== value ||
      (info.boolean && !value)
    ) {
      continue
    }

    // Accept `array`.
    // Most props are space-separated.
    if (typeof value === 'object' && 'length' in value) {
      value = (info.commaSeparated ? commas : spaces)(value)
    }

    // Treat `true` and truthy known booleans.
    if (value === true || info.boolean) {
      value = ''
    }

    // Cast everything else to string.
    if (typeof value !== 'string') {
      value = String(value)
    }

    attributes[name] = value
  }

  return attributes
}
