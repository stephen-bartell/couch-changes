
var inject = require('reconnect/inject')
var request = require('request')
var stream = require('stream')

var defaults = 
  { randomisationFactor: 0
  , initialDelay: 500
  , maxDelay: 1000
  , immediate: true
  }

module.exports = function ChangesStream(options) {
  var upstream = stream.PassThrough()

  var reconnect = inject(function createConnection() {
    var req = request(options)

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