'use strict';

module.exports = function(grunt) {
    return function task() {
        var _ = require('underscore');
        var asynquence = require('asynquence');
        var ProgressBar = require('progress');
        var restler = require('restler');
        var unzip = require('unzip');
        var http = require('http');
        var csv = require('csv');
        var fs = require('fs');
        
        var done = this.async();
        var destDir = process.cwd() + '/translations-tmp';
        var dest = destDir + '/translations.zip';
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

        function getVersion(done) {
            restler
                .get('http://elvira.olx.com.ar/tags/api/query.php?repo=smaug-translations&env=testing')
                .on('success', done)
                .on('error', done.fail)
                .on('fail', done.fail);
        }

        function create(done, version) {
            grunt.file.mkdir(destDir);
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
                path: destDir
            })).on('close', done).on('end', done).on('error', done.fail);
        }

        asynquence().or(fail)
            .then(getVersion)
            .then(create)
            .then(download)
            .then(unZip)
            .val(done);
    };
};
