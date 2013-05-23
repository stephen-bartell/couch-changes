
var Transform = require('stream').Transform
var inherits = require('util').inherits

var Catcher =
module.exports = function Catcher() {
  if (!(this instanceof Catcher))
    return new Catcher()

  Transform.call(this, {objectMode: true})
}

inherits(Catcher, Transform)

Catcher.prototype._transform = function (data, enc, done) {
  if (data[0] === 0x0a) {
    this.emit('heartbeat')
    return done()
  }
  this.push(data)
  done()
}