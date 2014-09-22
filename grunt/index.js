'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {
    require('load-grunt-config')(grunt, {
        configPath: __dirname + '/contrib'
    });
    fs.readdirSync(__dirname + '/tasks').forEach(function task(filename) {
        var name = path.basename(filename, '.js');

        grunt.registerTask(name, require('./tasks/' + name)(grunt));
    });
};
