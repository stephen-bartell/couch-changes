
var request = require('request')
var through = require('through')
var es = require('event-stream')
var Stream = require('stream')

function CouchError(name, message, code) {
  this.name = name
  this.message = message
  this.code = code
}
CouchError.prototype = new Error()
CouchError.prototype.constructor = CouchError

function changesOLD (onError, uri) {
  if (!onError)
    onError = function (er) {
      throw er
    }

  var req = request(uri)

  return req
    .on('error', onError)
    .pipe(es.split())
    .pipe(es.parse())
    .pipe(through(function (data) {
      var code = req.response.statusCode
      if (code >= 200 && code < 400)
        this.emit('data', data)
      else
        this.emit('error', new CouchError(data.error, data.reason, code))
    }))
    .on('error', onError)
    .pipe(through(function (data) {
      console.log(data)
    }))
}

function onError (er) {
  console.log('error')
  console.log(er)
}

function changes (uri) {
  var downstream = Stream.PassThrough()

  request(uri)
    .on('error', function (er) {
      downstream.emit('error', er)
    })
    .on('response', function (res) {
      if (res.statusCode >= 400)
        res.pipe(through(function (data) {
          downstream.emit('error', JSON.parse(data))
        }))
      else
        res.pipe(downstream)
    })

  return downstream
}

var c = changes(process.argv[2])
.on('error', function (er) {
  console.log(er)
  // er.pipe(process.stderr)
})
.pipe(es.split())
.pipe(es.parse())
.pipe(es.log())




