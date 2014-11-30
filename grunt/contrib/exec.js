'use strict';

module.exports = function(grunt) {
    return {
        removeTranslations: 'rm -rf translations/translations-tmp',
        removeJsTranslations: 'rm -rf translations/**.js'
    };
};