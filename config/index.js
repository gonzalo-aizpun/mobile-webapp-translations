'use strict';

var _ = require('underscore');
var CONFIG = require('./default');

module.exports = function() {

    function get(keys, defaultValue) {
        var value;

        if (!Array.isArray(keys)) {
            if (typeof keys === 'undefined') {
                keys = [];
            } else {
                keys = [keys];
            }
        }
        if (typeof defaultValue === 'undefined') {
            defaultValue = null;
        }
        if (!keys.length) {
            return defaultValue || CONFIG;
        }
        keys.every(function iterate(key, index) {
            try {
                if (!index) {
                    value = CONFIG[key];
                }
                else {
                    value = value[key];
                }
            }
            catch (err) {
                value = null;
                return false;
            }
            return true;
        });
        if (typeof value === 'undefined' || value === null) {
            return defaultValue;
        }
        return _.isFunction(value) ? value : _.clone(value);
    }

    return {
        get: get
    };
}();
