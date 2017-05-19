var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

mkdirp.sync('./dbs');

require('./parseFn');

require('./create');
require('./find');
require('./update');

process.on('beforeExit', function(){
    rimraf.sync('./dbs');
});