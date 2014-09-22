'use strict';

module.exports = function(grunt) {
    require('./grunt')(grunt);

    grunt.registerTask('translate', ['exec:removeTranslations', 'translations', 'copy', 'exec:removeTranslations']);
};
