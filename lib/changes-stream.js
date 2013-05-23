
var inject = require('reconnect/inject')
var request = require('request')
var stream = require('stream')
var url = require('url')
var es = require('event-stream')
var through = require('through')
var Parser = require('./parse-stream')

var defaults = 
  { randomisationFactor: 0
  , initialDelay: 500
  , maxDelay: 1000
  , immediate: true
  }

function info (url, cb) {

}


function Counter(startseq) {
  if (!(this instanceof Counter))
    return new Counter()

  this.seq = startseq || 0

  stream.Transform.call(this, {objectMode: true})
}

Counter.prototype = Object.create(
  stream.Transform.prototype, { constructor: { value: Counter }})

Counter.prototype._transform = function (doc, enc, done) {
  if (doc.seq)
    this.seq = doc.seq
  this.push(doc)
  done()
}


module.exports = function ChangesStream(urlobj) {
  if (!urlobj.query) urlobj.query = {}
  urlobj.query.feed = 'continuous'
  urlobj.query.since = urlobj.hasOwnProperty('since') ? urlobj.since : 0

  var downstream = stream.PassThrough({objectMode: true})

  downstream.on('pipe', function () {
    'piped'
  })
  var parser = Parser()
  var counter = Counter(urlobj.since)

  var reconnect = inject(function createConnection() {
    // TODO: fetch seqnum and check if it is less than counter.seq.  
    // If it is, then that mean the db got erased and remade.
    // So start from seqnum, not counter.seq. And reset counter.seq
    urlobj.query.since = counter.seq
    var uri = url.format(urlobj)
    var changes = request(uri)

    var onClose = function () {
      reconnect.disconnect()
      changes.destroy()
    }

    if (downstream.listeners('close').length == 0)
      downstream.once('close', onClose)

    return changes

  })(defaults, function (changes) {
    counter.unpipe(downstream)

    changes
      .pipe(es.split())
      .pipe(es.parse())
      .pipe(counter, { end: false })
      .pipe(downstream, { end: false })

  }).connect()

  return downstream
}