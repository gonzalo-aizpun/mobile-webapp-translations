
// Modules
// ===========================

var _ = require('underscore');
var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
var csv = require('csv');
var asynquence = require('asynquence');
var ProgressBar = require('progress');
var config = require('./config');
var app = express();
var translations = {};


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

var LANGUAGES = config.get(['languages', 'list']);
var DEFAULT_LANGUAGE = config.get(['languages', 'default']);
var DEFAULT_SETTING = _.defaults({}, config.get('settings'), {
    file: DEFAULT_LANGUAGE
});


// Helpers
// ===========================

function getLanguage(language) {
    var file = translations[language];

    if (!file) {
        try {
            translations[language] = file = require('./translations/' + language);
        } catch(e) {
            console.error('Language', language, 'not exists. Search in default', DEFAULT_LANGUAGE, e);
            file = translations[DEFAULT_LANGUAGE];
        }
    }
    return file;
}


// Routes
// ===========================

(function index() {
    app.get('/', handler);

    function handler(req, res) {
        res.render('index', {
            title: 'Keyword search',
            languages: LANGUAGES,
            settings: DEFAULT_SETTING
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
        var languages = LANGUAGES;
        var regexp;

        function prepare(done) {
            settings = settings || {};
            settings = _.defaults(settings, {
                caseSensitive: !!settings.caseSensitive,
                allLanguages: !!settings.allLanguages
            }, DEFAULT_SETTING);

            regexp = ['.*', keyword.replace(/[$-\/?[-^{|}]/g, '\\$&').replace(' ', '\\s'), '.*'].join('');
            regexp = new RegExp(regexp, (settings.caseSensitive ? undefined : 'i'));

            if (!settings.allLanguages) {
                languages = [language];
            }
            done();
        }

        function findMatchs(done) {
            var bar = new ProgressBar('searching keyword \"' + keyword + '\" [:bar] :percent :etas', {
                complete: '=',
                incomplete: ' ',
                width: 50,
                total: languages.length
            });
            var id = 0;

            console.log();
            languages.forEach(function findKeyword(language, index) {
                bar.tick(1);
                _.each(getLanguage(language), function findMatch(value, key) {
                    key = _.unescape(key);
                    if (_.unescape(key).match(regexp) || value.value.match(regexp)) {
                        matchs.push({
                            id: ++id,
                            translation: {
                                key: key,
                                value: value.value
                            },
                            index: (value.index + 1)
                        });
                    }
                });
            });
            console.log();
            done();
        }

        function success() {
            res.json({
                state: {
                    title: 'Result - Keyword search',
                    key: false,
                    keyword: keyword,
                    matchsLength: matchs.length,
                    file: language,
                    languages: LANGUAGES,
                    allLanguages: settings.allLanguages
                },
                models: matchs
            });
        }

        function fail(err) {
            console.log(err.stack || 'Internal error');
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
        var matchs = [];
        var key = req.param('key', '');
        var keyword = req.body.keyword;
        var language = req.body.language;
        var settings = req.body.settings;

        function findMatchs(done) {
            var id = 0;

            LANGUAGES.forEach(function findKey(language) {
                var value = getLanguage(language)[_.escape(key)];

                if (value) {
                    matchs.push({
                        id: ++id,
                        translation: {
                            value: value.value
                        },
                        file: language
                    });
                }
            });
            done();
        }

        function success() {
            res.json({
                state: {
                    title: 'Key - Keyword search',
                    key: key,
                    keyword: keyword,
                    matchsLength: matchs.length,
                    file: language,
                    languages: LANGUAGES
                },
                models: matchs
            });
        }

        function fail(err) {
            console.log(err.stack || 'Internal error');
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
