
var reconnect = require('reconnect/inject')
var request = require('request')
var PassThrough = require('stream').PassThrough
var url = require('url')
var es = require('event-stream')
var through = require('through')
var Parser = require('./parse-stream')
var Counter = require('./count-stream')
var Catcher = require('./catch-heartbeats')

// var opts = 
//   { randomisationFactor: 0
//   , initialDelay: 500
//   , maxDelay: 1000
//   , immediate: true
//   }


module.exports = function ChangesStream(urlobj) {
  if (!urlobj.query) urlobj.query = {}
  urlobj.query.feed = 'continuous'
  urlobj.query.heartbeat = 59000
  urlobj.query.timeout = 60000
  urlobj.query.since = urlobj.hasOwnProperty('since') ? urlobj.since : 0

  this.lastHeartbeat = Date.now()

  var parser = Parser()
  var counter = Counter(urlobj.since)

  var catcher = Catcher()
    .on('heartbeat', function () {
      this.lastHeartbeat = Date.now()
    })

  var downstream = PassThrough({objectMode: true})
  var stream

  function createConnection() {
    // TODO: fetch seqnum and check if it is less than counter.seq.  
    // If it is, then that mean the db got erased and remade.
    // So start from seqnum, not counter.seq. And reset counter.seq
    urlobj.query.since = counter.seq
    var uri = url.format(urlobj)
    return request(uri)
  }

  function onConnect(_stream) {

    stream = _stream

    catcher.unpipe(parser)
    parser.unpipe(counter)
    counter.unpipe(downstream)

    _stream
      .pipe(catcher, {end: false})
      .pipe(es.split())
      .pipe(parser, {end: false})
      .pipe(counter, { end: false })
      .pipe(downstream, { end: false })

  }

  var emitter = reconnect(createConnection)(onConnect)
    .on('connect', function (stream) {
      downstream.emit('connect', stream)
    })
    .on('disconnect', function (stream) {
      downstream.emit('disconnect', stream)
    })
    .on('reconnect', function (attempts, delay) {
      downstream.emit('reconnect', attempts, delay)
    })
    .connect()

  downstream.reconnect = emitter.reconnect

  downstream.once('close', function onclose() {
    emitter.disconnect()
    stream.destroy()
  })

  return downstream
}