var mainBowerFiles = require('main-bower-files');
var fs = require('fs');
var path = require('path');
var files = mainBowerFiles();

var dest = path.join(__dirname, 'dist/bower_components');
fs.mkdir(dest);

for (var i = 0, len = files.length; i < len; i++) {
  fs.createReadStream(files[i]).pipe(fs.createWriteStream(path.join(dest, path.basename(files[i]))));
}