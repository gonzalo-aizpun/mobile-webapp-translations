'use strict';

module.exports = function(grunt) {
    require('./grunt')(grunt);

    grunt.registerTask('translate', ['exec:removeJsTranslations', 'translations', 'copy']);

    grunt.registerTask('default', ['translate']);
};
