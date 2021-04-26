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

function invalid(value) {
  throw new Error('Expected node, not `' + value + '`')
}

function unknown(value) {
  throw new Error('Cannot transform node of type `' + value.type + '`')
}

export function toXast(tree, options) {
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

// eslint-disable-next-line complexity
function element(node, parentConfig) {
  var props = node.properties || {}
  var schema = parentConfig.schema
  var attributes = {}
  var config
  var value
  var key
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
    else if (typeof value === 'object' && 'length' in value) {
      value = info.commaSeparated ? commas(value) : spaces(value)
    }
    // Cast everything else to string.
    else if (typeof value !== 'string') {
      value = String(value)
    }

    attributes[info.attribute] = value
  }

  return patch(node, {type: 'element', name: node.tagName, attributes}, config)
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
