
var Transform = require('stream').Transform
var inherits = require('util').inherits

var Parser =
module.exports = function Parser() {
  if (!(this instanceof Parser))
    return new Parser()

  Transform.call(this, {objectMode: true})
}

inherits(Parser, Transform)

Parser.prototype._transform = function (data, enc, done) {
  var obj
  try {
    obj = JSON.parse(data.toString())
  } catch (er) { /*dont do anything */ }

  if (obj !== undefined)
    this.push(obj)
  done()
}