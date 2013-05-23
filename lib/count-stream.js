
var Transform = require('stream').Transform
var inherits = require('util').inherits

var Counter =
module.exports = function Counter(startseq) {
  if (!(this instanceof Counter))
    return new Counter()

  this.seq = startseq || 0

  Transform.call(this, {objectMode: true})
}

inherits(Counter, Transform)

Counter.prototype._transform = function (doc, enc, done) {
  if (doc.seq)
    this.seq = doc.seq
  this.push(doc)
  done()
}