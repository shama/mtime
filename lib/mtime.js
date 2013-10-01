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

function MTime() {
  if (!(this instanceof MTime)) { return new MTime(); }
}
module.exports = MTime;
module.exports.MTime = MTime;

MTime.prototype.older = function(files, compareDir, options) {
  options = options || {};
  options.cwd = options.cwd || process.cwd();
  var compareFiles = readdir(compareDir).map(function(file) {
    return path.relative(compareDir, file);
  });
  return files.filter(function(file) {
    var exists = compareFiles.indexOf(file);
    if (exists !== -1) {
      compareFiles.splice(exists, 1);
      var fileTime = fs.lstatSync(path.resolve(options.cwd, file)).mtime;
      var compareTime = fs.lstatSync(path.resolve(compareDir, file)).mtime;
      return ((fileTime - compareTime) < 0);
    }
    return true;
  }).concat(compareFiles);
};
