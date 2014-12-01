'use strict';

module.exports = function(grunt) {
    var rBrand = /<<BRAND>>/g;
    var BRAND = 'OLX';

    return function task() {
        var _ = require('underscore');
        var asynquence = require('asynquence');
        var ProgressBar = require('progress');
        var restler = require('restler');
        var unzip = require('unzip');
        var jsesc = require('jsesc');
        var http = require('http');
        var csv = require('csv');
        var fs = require('fs');
        var config = require('../../config');
        
        var done = this.async();
        var rootDir = process.cwd() + '/translations';
        var tmpDir = rootDir + '/translations-tmp';
        var dest = tmpDir + '/translations.zip';
        var languages = config.get(['languages', 'list'], []);
        var file;

        function fail(err) {
            function callback() {
                throw err;
            }

            if (file) {
                return file.close(callback);
            }
            callback();
        }

        function localVersion(done) {
            var tagFile = tmpDir + '/TAG';

            done((grunt.file.exists(tagFile)) ? grunt.file.read(tagFile).trim() : false);
        }

        function remoteVersion(done) {
            restler.get('http://elvira.olx.com.ar/tags/api/query.php?repo=smaug-translations&env=testing')
                .on('error', done.fail)
                .on('fail', done.fail)
                .on('success', function success(data) {
                    done(data);
                });
        }

        function decide(done, local, remote) {
            if (local === remote) {
                console.log('\nLocal files version (' + local + ') is up to date with remote (' + remote + ')');
                done();
            }
            else {
                if (local) {
                    console.log('\nLocal files version (' + local + ') is outdated from remote (' + remote + ')\n');
                }
                else {
                    console.log('\nLocal files are missing\n');
                }
                asynquence(remote).or(done.fail)
                    .then(create)
                    .then(download)
                    .then(unZip)
                    .then(copyTag)
                    .val(done);
            }
        }

        function create(done, version) {
            grunt.file.mkdir(tmpDir);
            file = fs.createWriteStream(dest).on('open', onOpen);

            function onOpen() {
                done(version);
            }
        }

        function download(done, version) {
            http.request({
                host: 'jfrog.olx.com.ar',
                path: '/artifactory/mobile-jenkins-release/olx/smaug-translations/smaug-translations-' + version + '.zip'
            }).on('response', onResponse).on('error', done.fail).end();

            function onResponse(res) {
                var total = parseInt(res.headers['content-length'], 10);
                var bar = new ProgressBar('downloading smaug-translations-' + version + '.zip [:bar] :percent :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 20,
                    total: total
                });

                function onData(chunk) {
                    bar.tick(chunk.length);
                    file.write(chunk);
                }

                function onEnd() {
                    console.log();
                    file.close(done);
                }

                console.log();
                res
                    .on('data', onData)
                    .on('end', onEnd);
            }
        }

        function unZip(done) {
            fs.createReadStream(dest).pipe(unzip.Extract({
                path: tmpDir
            })).on('close', done).on('end', done).on('error', done.fail);
        }

        function copyTag(done) {
            var srcFile = tmpDir + '/TAG';

            if (grunt.file.exists(srcFile)) {
                grunt.file.copy(srcFile, rootDir + '/TAG');
            }
            done();
        }

        function csvToJs(done) {
            var promise = asynquence().or(done.fail);
            var index = ["'use strict';\n\nmodule.exports = {"];
            var j = 0;

            languages.forEach(function each(language) {
                if (j) {
                    index.push(',');
                }
                index.push("\n    '");
                index.push(language);
                index.push("': require('./");
                index.push(language);
                index.push("')");
                j++;
                promise.then(eachDictionary);

                function eachDictionary(next) {
                    var dictionary = ["'use strict';\n\nmodule.exports = {"];
                    var i = 0;

                    csv().from(tmpDir + '/' + language + '.csv').on('record', function onData(record, index) {
                        record = record.slice(1);
                        if (i) {
                            dictionary.push(',');
                        }
                        dictionary.push("\n    '");
                        dictionary.push(_.escape(record[0]));
                        dictionary.push("': {value: '");
                        dictionary.push(jsesc(record[1].replace(rBrand, BRAND)));
                        dictionary.push("', index: ");
                        dictionary.push(index);
                        dictionary.push("}");
                        i++;
                    }).on('end', function onEnd() {
                        dictionary.push('\n};\n');
                        grunt.file.write(rootDir + '/' + language + '.js', dictionary.join(''));
                        console.log('File "' + rootDir + '/' + language + '.js" created');
                        next();
                    });
                }
            });
            index.push('\n};\n');
            grunt.file.write(rootDir + '/index.js', index.join(''));
            console.log('\nFile "' + rootDir + '/index.js" created');
            promise.val(done);
        }

        asynquence().or(fail)
            .gate(localVersion, remoteVersion)
            .then(decide)
            .then(csvToJs)
            .val(done);
    };
};
