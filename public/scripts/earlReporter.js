(function() {
    // determine if in-browser or using node.js
    var _nodejs = (
        typeof process !== 'undefined' && process.versions && process.versions.node);
    var _browser = !_nodejs &&
        (typeof window !== 'undefined' || typeof self !== 'undefined');

    if (_nodejs) {

    } else if (_browser) {

    }

    if(_nodejs) {
        // export nodejs API
        module.exports = earlReporter;
    } else if(typeof define === 'function' && define.amd) {
        // export AMD API
        define([], function() {
            return earlReporter;
        });
    } else if(_browser) {
        window.earlReporter = earlReporter;
    }
}());