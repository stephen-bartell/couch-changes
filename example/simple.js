
var Changes = require('../')
var es = require('event-stream')

var stream = require('stream')

var opts = {
    uri: 'http://localhost:5984/test/_changes'
  , qs: {
        include_docs: true
      , since: 'now'
      , feed: 'continuous'
    }
}

var changes = Changes(opts)
  .pipe(es.split())
  .pipe(es.parse())
  .pipe(es.log())
