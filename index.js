
// Modules
// ===========================

var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var csv = require('csv');
var asynquence = require('asynquence');
var app = express();


// Middlewares
// ===========================

app.use(express.json());
app.use(express.urlencoded());


// Configurations
// ===========================

app.engine('.html', ejs.__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');


// Constants
// ===========================

var languages = [
    'en-US', 'es-AR', 'es-ES', 'es-EC', 'es-SV', 'fr-FR', 'ht-HT', 'ja-JP', 'ml-IN', 'no-NO', 'ro-RO', 'sr-RS',
    'te-IN', 'uk-UA', 'ar-AE', 'ca-ES', 'en-IN', 'bs-BA', 'es-VZ', 'gu-IN', 'hu-HU', 'kn-IN', 'mr-IN', 'pa-PK',
    'ru-RU', 'sv-SE', 'th-TH', 'ur-PK', 'ar-EG', 'cs-CZ', 'af-ZA', 'es-GT', 'et-EE', 'he-IL', 'id-ID', 'ko-KR',
    'ms-MY', 'pl-PL', 'si-LK', 'sw-TZ', 'th-TW', 'vi-VN', 'bg-BG', 'da-DK', 'el-GR', 'es-MX', 'fi-FI', 'hi-IN',
    'is-IS', 'lt-LT', 'nl-BG', 'pt-BR', 'sk-SK', 'tl-PH', 'zh-CN', 'bn-BD', 'de-DE', 'es-CO', 'es-PE', 'fr-CA',
    'hr-HR', 'it-IT', 'lv-LV', 'nl-NL', 'pt-PT', 'sl-SI', 'ta-IN', 'tr-TR', 'zh-TW'
];


// Routes
// ===========================

(function index() {
    app.get('/', handler);

    function handler(req, res) {
        res.render('index', {
            title: 'Keyword search',
            languages: languages
        });
    }
})();

(function search() {
    app.post('/search', handler);

    function handler(req, res) {
        var matchs = [];
        var language = req.body.language;
        var keyword = req.body.keyword;

        function fail(err) {
            if (err) {
                console.log(err);
            }
            success(' - ERROR');
        }

        function findMatchs(done) {
            var filename = [__dirname, '/translations/smaug-translations-0.1.161/', language, '.csv'].join('');

            csv().from(filename).on('record', function onData(record, index) {
                record = record.slice(1);
                if (~record[0].indexOf(keyword) || ~record[1].indexOf(keyword)) {
                    matchs.push({
                        translation: {
                            key: record[0],
                            value: record[1]
                        }, 
                        index: (index + 1)
                    });
                }
            }).on('end', done);
        }

        function success(message) {
            var title = 'Result - Keyword search';

            if (typeof message === 'string') {
                title += message;
            }
            res.render('result', {
                title: title,
                keyword: keyword,
                matchsLength: matchs.length,
                matchs: matchs,
                file: language,
                languages: languages
            });
        }

        asynquence().or(fail)
            .then(findMatchs)
            .val(success);
    }
})();

(function key() {
    app.get('/search/key/:key', handler);

    function handler(req, res) {
        var matchs = [];
        var key = req.param('key', '');
        var keyword = req.param('keyword', '');
        var language = req.param('language', '');

        function fail(err) {
            if (err) {
                console.log(err);
            }
            success(' - ERROR');
        }

        function findMatchs(done) {
            var promise = asynquence().or(done.fail);

            languages.forEach(function findKeyInFile(file) {
                promise.then(function findMatch(next) {
                    var filename = [__dirname, '/translations/smaug-translations-0.1.161/', file, '.csv'].join('');

                    csv().from(filename).on('record', function onData(record, index) {
                        record = record.slice(1);
                        if (record[0] === key) {
                            matchs.push({
                                translation: record[1],
                                file: file
                            });
                            this.pause();
                            this.end();
                        }
                    }).on('end', next);
                });
            });
            promise.val(done);
        }

        function success(message) {
            var title = 'Key - Keyword search';

            if (typeof message === 'string') {
                title += message;
            }
            res.render('key', {
                title: title,
                key: key,
                keyword: keyword,
                matchsLength: matchs.length,
                matchs: matchs,
                file: language,
                languages: languages
            });
        }

        asynquence().or(fail)
            .then(findMatchs)
            .val(success);
    }

})();

app.listen(4000);

console.log('Node run in port 4000');