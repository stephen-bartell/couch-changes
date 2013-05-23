
var Changes = require('../')
var es = require('event-stream')
var through = require('through')

var stream = require('stream')

var opts =
    { protocol: 'http'
    , host: 'localhost:5984'
    , pathname: 'endpoint_config/_changes'
    }

var changes = Changes(opts)
  .pipe(through(function (data) {
    this.emit('data', data)
  }))
  .pipe(es.log())
