'use strict';

module.exports = function(grunt) {
    var _ = require('underscore');
    var config = require('../config');
    var csvs = [];

    (function copyCsvs() {
        _.each(config.get('languages'), function(language) {
            csvs.push({
                src: ['translations-tmp/', language, '.csv'].join(''),
                dest: ['translations/smaug-translations/', language, '.csv'].join('')
            });
        });
    })();

    return {
        csv: {
            files: csvs
        }
    };
};
