# mtime [![Build Status](https://secure.travis-ci.org/shama/mtime.png?branch=master)](http://travis-ci.org/shama/mtime)

Compare file trees and return files that have been modified with dependency graphing.

## Getting Started
Install the module with: `npm install mtime`

```javascript
var MTime = require('mtime');

// Compare two folders by modified time
var mtime = new MTime();
var diff = mtime.compare('folder1', 'folder2');

// Compare array of file paths to another folder by shasum
var mtime = new MTime({ method: 'sha', cwd: 'folder1' });
var diff = mtime.compare(['foo.js', 'bar.js'], 'folder2');

// Compare arbitrary manifests
var time = new Date(1982);
var mtime = new MTime({
  manifest: {
    'foo.js': { mtime: time },
    'bar.js': { mtime: time },
  }
});
var diff = mtime.compare({
  'foo.js': { mtime: new Date() },
  'bar.js': { mtime: time },
});
// diff === ['foo.js']
```

## Documentation

_Total work-in-progress._

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Kyle Robinson Young  
Licensed under the MIT license.
