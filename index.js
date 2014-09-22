
// Modules
// ===========================

var _ = require('underscore');
var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var csv = require('csv');
var asynquence = require('asynquence');
var app = express();
var defaultSettings = {
    file: 'en-US',
    caseSensitive: true
};


// Middlewares
// ===========================

app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(__dirname + '/public'));


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
            languages: languages,
            settings: defaultSettings
        });
    }
})();

(function search() {
    app.post('/search/:keyword?', handler);

    function handler(req, res) {
        var matchs = [];
        var keyword = req.body.keyword;
        var language = req.body.language;
        var settings = req.body.settings;
        var regexp;

        function prepare(done) {
            settings = settings || {};
            settings = _.defaults(settings, {
                caseSensitive: !!settings.caseSensitive
            }, defaultSettings);

            regexp = ['.*', keyword.replace(/[$-\/?[-^{|}]/g, '\\$&').replace(' ', '\s'), '.*'].join('');
            regexp = new RegExp(regexp, (settings.caseSensitive ? undefined : 'i'));

            done();
        }

        function findMatchs(done) {
            var filename = [__dirname, '/translations/smaug-translations/', language, '.csv'].join('');
            var id = 0;

            csv().from(filename).on('record', function onData(record, index) {
                record = record.slice(1);
                if (record[0].match(regexp) || record[1].match(regexp)) {
                    matchs.push({
                        id: ++id,
                        translation: {
                            key: record[0],
                            value: record[1]
                        }, 
                        index: (index + 1)
                    });
                }
            }).on('end', done);
        }

        function success() {
            res.json({
                state: {
                    title: 'Result - Keyword search',
                    key: false,
                    keyword: keyword,
                    matchsLength: matchs.length,
                    file: language,
                    languages: languages
                },
                models: matchs
            });
        }

        function fail(err) {
            if (err) {
                console.log(err ? err.stack || err : 'Internal error');
            }
            res.json(503, {
                error: (err ? err.message : '') || 'Internal error'
            });
        }

        asynquence().or(fail)
            .then(prepare)
            .then(findMatchs)
            .val(success);
    }
})();

(function key() {
    app.post('/search/key/:key', handler);

    function handler(req, res) {
        var matchs = {};
        var key = req.param('key', '');
        var keyword = req.body.keyword;
        var language = req.body.language;
        var settings = req.body.settings;

        function findMatchs(done) {
            var promise = asynquence().or(done.fail);
            var id = 0;

            languages.forEach(function findKeyInFile(file) {
                promise.then(function findMatch(next) {
                    var filename = [__dirname, '/translations/smaug-translations/', file, '.csv'].join('');

                    csv().from(filename).on('record', function onData(record, index) {
                        record = record.slice(1);
                        if (record[0] === key && !matchs[file]) {
                            matchs[file] = {
                                id: ++id,
                                translation: {
                                    value: record[1]
                                },
                                file: file
                            };
                            this.pause();
                            this.end();
                        }
                    }).on('end', next);
                });
            });
            promise.val(done);
        }

        function success() {
            matchs = _.values(matchs);

            res.json({
                state: {
                    title: 'Key - Keyword search',
                    key: key,
                    keyword: keyword,
                    matchsLength: matchs.length,
                    file: language,
                    languages: languages
                },
                models: matchs
            });
        }

        function fail(err) {
            if (err) {
                console.log(err ? err.stack || err : 'Internal error');
            }
            res.json(503, {
                error: (err ? err.message : '') || 'Internal error'
            });
        }

        asynquence().or(fail)
            .then(findMatchs)
            .val(success);
    }
})();

(function notFound() {
    app.get('*', handler);

    function handler(req, res) {
        res.redirect(302, '/');
    }
})();

app.listen(4000);

console.log('Node run in port 4000');