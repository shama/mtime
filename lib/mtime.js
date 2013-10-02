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
var sha = require('sha1');
var touch = require('touch').sync;

function MTime(opts) {
  if (!(this instanceof MTime)) { return new MTime(opts); }
  opts = opts || {};
  this.cwd = opts.cwd || process.cwd();
  this._manifest = this._createManifest(opts.manifest || Object.create(null));
  this.method = opts.method || 'mtime';
}
module.exports = MTime;
module.exports.MTime = MTime;

MTime.prototype._createManifest = function(manifest, opts) {
  var self = this;
  opts = opts || {};
  opts.cwd = (opts.cwd && typeof opts.cwd === 'string') ? opts.cwd : this.cwd;
  var out = Object.create(null);
  if (typeof manifest === 'string') {
    manifest = readdir(manifest).map(function(file) {
      return path.relative(manifest, file);
    });
  }
  if (Array.isArray(manifest)) {
    manifest.forEach(function(file) {
      var filepath = path.resolve(opts.cwd, file);
      out[file] = {};
      if (self.method === 'sha') {
        out[file]['sha'] = sha(String(fs.readFileSync(filepath)));
      } else {
        out[file]['mtime'] = fs.lstatSync(filepath).mtime;
      }
    });
  } else {
    out = manifest;
  }
  return out;
};

MTime.prototype.compare = function(current, compare) {
  if (compare == null) {
    compare = current;
    current = null;
  }

  var currentManifest = (current) ? this._createManifest(current) : this._manifest;
  var compareManifest = (compare) ? this._createManifest(compare, { cwd: compare }) : [];

  var fn = (this.method === 'mtime') ? mtimeMethod : shaMethod;

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

MTime.prototype.mark = function(manifest) {
  var self = this;
  manifest = (manifest) ? this._createManifest(manifest, { cwd: this.cwd }) : this._manifest;
  Object.keys(manifest).forEach(function(file) {
    touch(path.resolve(self.cwd, file), { mtime: true });
  });
};

function mtimeMethod(current, other) {
  return ((current.mtime - other.mtime) >= 0);
}

function shaMethod(current, other) {
  return (current.sha === other.sha);
}
