/*
 * mtime
 * https://github.com/shama/mtime
 *
 * Copyright (c) 2013 Kyle Robinson Young
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var readdir = require('readdirrsync');

function MTime(opts) {
  if (!(this instanceof MTime)) { return new MTime(opts); }
  opts = opts || {};
  this.cwd = opts.cwd || process.cwd();
}
module.exports = MTime;
module.exports.MTime = MTime;

MTime.prototype._createManifest = function(manifest, options) {
  options = options || {};
  options.cwd = options.cwd || this.cwd;
  var out = Object.create(null);
  if (typeof manifest === 'string') {
    manifest = readdir(manifest).map(function(file) {
      return path.relative(options.cwd, file);
    });
  }
  if (Array.isArray(manifest)) {
    manifest.forEach(function(file) {
      out[file] = {
        mtime: fs.lstatSync(path.resolve(options.cwd, file)).mtime,
        sha: null,
      };
    });
  } else {
    out = manifest;
  }
  return out;
};

MTime.prototype.compare = function(current, compare, fn) {
  var self = this;
  var currentManifest = this._createManifest(current, { cwd: this.cwd });
  var compareManifest = this._createManifest(compare, { cwd: compare });

  if (fn === 'mtime' || fn == null) {
    fn = function(current, other) {
      return ((current.mtime - other.mtime) >= 0);
    };
  } else if (fn === 'sha') {
    fn = function(current, other) {
      return (current.sha !== other.sha);
    };
  }

  var compareKeys = Object.keys(compareManifest);
  var diff = [];
  Object.keys(currentManifest).forEach(function(file) {
    var exists = compareKeys.indexOf(file);
    if (exists !== -1) {
      var compareFile = compareKeys.splice(exists, 1);
      if (fn(currentManifest[file], compareManifest[compareFile])) {
        return;
      }
    }
    diff.push(file);
  });
  return diff.concat(compareKeys);
};
