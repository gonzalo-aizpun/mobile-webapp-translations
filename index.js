
// Modules
// ===========================

var express = require('express');
var ejs = require('ejs');
var fs = require('fs');
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


// Routes
// ===========================

(function index() {
    app.get('/', handler);

    function handler(req, res) {
        res.render('index', {
            title: 'Keyword search'
        });
    }
})();

(function search() {
    app.post('/search', handler);

    function find(keyword, filename) {
        var matchs = [];
        var translation;
        filename = __dirname + '/translations/smaug-translations-0.1.161/' + filename + '.csv';
        var translations = fs.readFileSync(filename);
        translations = translations.toString().split('\n');
        translations.forEach(function eachLines(line, index) {
            if (!line) {
                return;
            }

            translation = line.split('","');
            if (~translation[2].indexOf(keyword)) {
                matchs.push({
                    translation: {
                        key: translation[1],
                        value: translation[2].substr(0, translation[2].length - 2)
                    }, 
                    index: (index + 1)
                });
            }
        });
        return matchs;
    }

    function handler(req, res) {
        var file = 'en-US';
        var matchs = find(req.body.keyword, file);
        res.render('result', {
            title: 'Result - Keyword search',
            keyword: req.body.keyword,
            matchsLength: matchs.length,
            matchs: matchs,
            file: file
        });
    }
})();

(function key() {
    app.get('/search/key/:key', handler);

    var files = [
        'en-US', 'es-ES', 'el-GR', 'es-EC', 'es-SV', 'fr-FR', 'ht-HT', 'ja-JP', 'ml-IN', 'no-NO', 'ro-RO', 'sr-RS',
        'te-IN', 'uk-UA', 'ar-AE', 'ca-ES', 'en-IN', 'bs-BA', 'es-VZ', 'gu-IN', 'hu-HU', 'kn-IN', 'mr-IN', 'pa-PK',
        'ru-RU', 'sv-SE', 'th-TH', 'ur-PK', 'ar-EG', 'cs-CZ', 'af-ZA', 'es-GT', 'et-EE', 'he-IL', 'id-ID', 'ko-KR',
        'ms-MY', 'pl-PL', 'si-LK', 'sw-TZ', 'th-TW', 'vi-VN', 'bg-BG', 'da-DK', 'es-AR', 'es-MX', 'fi-FI', 'hi-IN',
        'is-IS', 'lt-LT', 'nl-BG', 'pt-BR', 'sk-SK', 'tl-PH', 'zh-CN', 'bn-BD', 'de-DE', 'es-CO', 'es-PE', 'fr-CA',
        'hr-HR', 'it-IT', 'lv-LV', 'nl-NL', 'pt-PT', 'sl-SI', 'ta-IN', 'tr-TR', 'zh-TW'
    ];

    function find(key, filename) {
        var matchs = [];
        var translation;
        var file = __dirname + '/translations/smaug-translations-0.1.161/' + filename + '.csv';
        var translations = fs.readFileSync(file);
        translations = translations.toString().split('\n');
        translations.forEach(function eachLines(line, index) {
            if (!line) {
                return;
            }

            translation = line.split('","');
            if (translation[1] === key) {
                matchs.push({
                    translation: translation[2].substr(0, translation[2].length - 2),
                    file: filename
                });
            }
        });
        if (matchs.length) {
            return matchs[0];
        }
    }

    function findKey(key) {
        var matchs = [];
        var match;
        files.forEach(function findKeyInFile(file) {
            match = find(key, file);
            if (match) {
                matchs.push(find(key, file));
                return;
            }
            matchs.push({
                file: file
            });
        });
        return matchs;
    }

    function handler(req, res) {
        var key = req.param('key', '');
        var matchs = findKey(key);
        res.render('key', {
            title: 'Key - Keyword search',
            key: key,
            matchsLength: matchs.length,
            matchs: matchs
        });
    }
})();

app.listen(4000);
