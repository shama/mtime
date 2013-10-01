'use strict';

var path = require('path');
var fs = require('fs');
var MTime = require('../lib/mtime.js');
var grunt = require('grunt');
var touch = require('touch').sync;
var readdir = require('readdirrsync');

function resetTimes(older, newer, cb) {
  readdir(older).forEach(function(file) {
    touch(file, {mtime: true});
  });
  setTimeout(function() {
    readdir(newer).forEach(function(file) {
      touch(file, {mtime: true});
    });
    cb();
  }, 100);
}

exports.mtime = {
  'setUp': function(done) {
    this.cwd = process.cwd();
    process.chdir(path.resolve(__dirname, 'fixtures'));
    resetTimes('older', 'compare', done);
  },
  'tearDown': function(done) {
    process.chdir(this.cwd);
    done();
  },
  'compare': function(test) {
    test.expect(1);

    touch(path.resolve('older/one.css'), { mtime: new Date(1982, 8, 22) });

    var result = new MTime({ cwd: 'older' }).compare(['one.css', 'two.css', 'sub/one.css'], 'compare');
    var expected = ['one.css', 'three.css', 'sub/two.css'];
    result.sort();
    expected.sort();

    test.deepEqual(result, expected);
    test.done();
  },
};
