
var Changes = require('../')
var es = require('event-stream')
var through = require('through')

var stream = require('stream')

var opts =
    { protocol: 'http'
    , host: '10.69.200.190'
    , pathname: '/cdb/endpoint_status/_changes'
    , auth: 'admin:password'
    }

var allowedRetries = 10

var changes = Changes(opts)
.on('connect', function () {
  console.log('connecting')
})
.on('disconnect', function (s) {
  console.log('disconnect')
})
.on('reconnect', function (attempts, delay) {
  console.log('reconnect', attempts, delay)
})
.pipe(through(function (data) {
  this.emit('data', data)
}))
.pipe(es.log())

