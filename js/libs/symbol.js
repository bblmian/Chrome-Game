// Symbol polyfill
let idCounter = 0

const Symbol = function Symbol(key) {
  return `__${key}_${Math.floor(Math.random() * 1e9)}_${++idCounter}__`
}

Symbol.iterator = Symbol('Symbol.iterator')
Symbol.asyncIterator = Symbol('Symbol.asyncIterator')
Symbol.hasInstance = Symbol('Symbol.hasInstance')
Symbol.isConcatSpreadable = Symbol('Symbol.isConcatSpreadable')
Symbol.match = Symbol('Symbol.match')
Symbol.matchAll = Symbol('Symbol.matchAll')
Symbol.replace = Symbol('Symbol.replace')
Symbol.search = Symbol('Symbol.search')
Symbol.species = Symbol('Symbol.species')
Symbol.split = Symbol('Symbol.split')
Symbol.toPrimitive = Symbol('Symbol.toPrimitive')
Symbol.toStringTag = Symbol('Symbol.toStringTag')
Symbol.unscopables = Symbol('Symbol.unscopables')

Symbol.for = Symbol.for || function(key) {
  let uid = Symbol.registry[key]
  if (!uid) {
    uid = Symbol(key)
    Symbol.registry[key] = uid
  }
  return uid
}

Symbol.keyFor = Symbol.keyFor || function(sym) {
  for (let key in Symbol.registry) {
    if (Symbol.registry[key] === sym) return key
  }
}

Symbol.registry = {}

module.exports = Symbol
