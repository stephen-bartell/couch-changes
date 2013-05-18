
var Changes = require('../')
var es = require('event-stream')

var stream = require('stream')

var changes = Changes('http://localhost:5984/test/_changes')
  .pipe(es.split())
  .pipe(es.parse())
  .pipe(es.log())
