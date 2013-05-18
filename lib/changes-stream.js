
var inject = require('reconnect/inject')
var request = require('request')
var stream = require('stream')
var url = require('url')

var defaults = 
  { randomisationFactor: 0
  , initialDelay: 500
  , maxDelay: 1000
  , immediate: true
  }

module.exports = function ChangesStream(opts) {
  var urlobj = 'string' == typeof opts ? url.parse(opts) : opts
  if (!urlobj.query) urlobj.query = {}
  urlobj.query.feed = 'continuous'

  var upstream = stream.PassThrough()

  var reconnect = inject(function createConnection() {
    var req = request(url.format(urlobj))

    upstream.once('close', function () {
      reconnect.disconnect()
      req.destroy()
    })

    return req

  })(defaults, function (changes) {
    changes.pipe(upstream, { end: false })

  }).connect()

  return upstream
}