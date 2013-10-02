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
var DepGraph = require('dependency-graph').DepGraph;

function MTime(opts) {
  if (!(this instanceof MTime)) { return new MTime(opts); }
  opts = opts || {};
  this.cwd = opts.cwd || process.cwd();
  this.method = opts.method || 'mtime';
  this._manifest = this._createManifest(opts.manifest || Object.create(null));
  this._dgraph = new DepGraph();
  this._hasDeps = false;
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
  var self = this;

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
  compareKeys = diff.concat(compareKeys);

  if (this._hasDeps) {
    compareKeys = compareKeys.map(function(file) {
      if (self._dgraph.hasNode(file)) {
        var dep = self._dgraph.dependantsOf(file);
        if (dep.length > 0) {
          return dep[0];
        }
      }
      return file;
    });
  }

  return compareKeys;
};

MTime.prototype.dependsOn = function(deps) {
  var self = this;
  self._hasDeps = true;
  Object.keys(deps).forEach(function(parent) {
    if (!self._dgraph.hasNode(parent)) {
      self._dgraph.addNode(parent);
    }
    deps[parent].forEach(function(child) {
      if (!self._dgraph.hasNode(child)) {
       self._dgraph.addNode(child);
      }
      self._dgraph.addDependency(parent, child);
    });
  });
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
