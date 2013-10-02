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
  'compare by sha': function(test) {
    test.expect(1);

    var result = new MTime({ cwd: 'older', method: 'sha' }).compare('older', 'compare');
    var expected = ['sub/one.css'];
    result.sort();
    expected.sort();

    test.deepEqual(result, expected);
    test.done();
  },
  'iterate': function(test) {
    test.expect(1);

    var mtime = new MTime({
      cwd: 'older',
      manifest: 'older',
    });
    var result = mtime.compare({
      'one.css': { mtime: new Date(1982) },
      'two.css': { mtime: new Date(1982) },
      'three.css': { mtime: new Date() },
    });
    var expected = ['sub/one.css', 'sub/two.css', 'three.css'];
    result.sort();
    expected.sort();

    test.deepEqual(result, expected);
    test.done();
  },
};

exports.deps = {
  'setUp': function(done) {
    this.cwd = process.cwd();
    process.chdir(path.resolve(__dirname, 'fixtures'));
    resetTimes('depends', 'compare', done);
  },
  'tearDown': function(done) {
    process.chdir(this.cwd);
    done();
  },
  'dependency graph': function(test) {
    test.expect(1);

    var mtime = new MTime({ cwd: 'depends', manifest: 'depends' });
    mtime.dependsOn({'index.js': ['foo.js']});

    setTimeout(function() {
      touch(path.resolve('depends/foo.js'), { mtime: true });
      test.deepEqual(mtime.compare('depends'), ['index.js']);

      test.done();
    }, 1000);
  },
};

/*exports.mark = {
  'setUp': function(done) {
    this.cwd = process.cwd();
    process.chdir(path.resolve(__dirname, 'fixtures'));
    resetTimes('older', 'compare', done);
  },
  'tearDown': function(done) {
    process.chdir(this.cwd);
    done();
  },
  'mark': function(test) {
    var mtime = new MTime();
    var before = mtime.compare('compare', 'older');
    //mtime.mark(before);
    //var after = mtime.compare(null, 'compare');
    //console.log(before);
    test.done();
  },
};*/
