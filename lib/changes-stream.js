
var inject = require('reconnect/inject')
var request = require('request')
var PassThrough = require('stream').PassThrough
var url = require('url')
var es = require('event-stream')
var through = require('through')
var Parser = require('./parse-stream')
var Counter = require('./count-stream')

var defaults = 
  { randomisationFactor: 0
  , initialDelay: 500
  , maxDelay: 1000
  , immediate: true
  }


module.exports = function ChangesStream(urlobj) {
  if (!urlobj.query) urlobj.query = {}
  urlobj.query.feed = 'continuous'
  urlobj.query.since = urlobj.hasOwnProperty('since') ? urlobj.since : 0

  var downstream = PassThrough({objectMode: true})

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
    parser.unpipe(counter)
    counter.unpipe(downstream)

    changes
      .pipe(es.split())
      .pipe(parser, {end: false})
      .pipe(counter, { end: false })
      .pipe(downstream, { end: false })

  }).connect()

  return downstream
}