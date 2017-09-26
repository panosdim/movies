var mainBowerFiles = require('main-bower-files');
var fse = require('fs-extra');
var path = require('path');
var files = mainBowerFiles();

var dest = path.join(__dirname, 'dist');

// Copy bower_components
for (var i = 0, len = files.length; i < len; i++) {
    var bower_path = files[i].split(path.sep);
    var bower_cmp = '';
    for (var j = 0, itm = bower_path.length; j < itm; j++) {
        if (bower_path[j] === 'bower_components') {
            bower_cmp = dest;
        }
        if (bower_cmp.length) {
            bower_cmp = path.join(bower_cmp, bower_path[j]);
        }
    }

    fse.ensureFileSync(bower_cmp);
    fse.copySync(files[i], bower_cmp);
}

var copyMinFiles = function(src) {
    if (fse.lstatSync(src).isDirectory()) {
        return true;
    } else {
        return  /^.*\.min.*$/.test(path.basename(src));
    }
};

// Copy css files
fse.copySync(path.join(__dirname, 'css'), path.join(dest, 'css'),{ filter: copyMinFiles});

// Copy js files
fse.copySync(path.join(__dirname, 'js'), path.join(dest, 'js'),{ filter: copyMinFiles});

// Copy image files
fse.copySync(path.join(__dirname, 'images'), path.join(dest, 'images'));

// Copy php files
fse.copySync(path.join(__dirname, 'php'), path.join(dest, 'php'));

// Copy index files
fse.copySync(path.join(__dirname, 'index.html'), path.join(dest, 'index.html'));