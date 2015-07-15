(function() {
    // determine if in-browser or using node.js
    var _nodejs = (
        typeof process !== 'undefined' && process.versions && process.versions.node);
    var _browser = !_nodejs &&
        (typeof window !== 'undefined' || typeof self !== 'undefined');


    // Get external dependencies
    var Handlebars   = (_nodejs ? require('./handlebars+helpers') : window.HandlebarsWithHelpers);
    var jsonld       = (_nodejs ? require('./jsonld') : window.jsonld);
    var context      = (_nodejs ? require('./context') : window.context);
    var wr20specData = (_nodejs ? require('./wr20specdata') : window.wr20specData);


    /**
     * Usage: earlReporter.createReport(templateStr, data, callback(error, html)
     *
     * @type {Object}
     */
    var earlReporter = {
        createReport: function(templateString, jsonSource, callback) {
            jsonld.compact(jsonSource, context, function (error, evalData) {
                var output;
                if (!error) {
                    var templContent = earlReporter.getTemplateContent(evalData);
                    var template     = Handlebars.compile(templateString);
                    output           = template(templContent);
                }
                callback(error, output);
            });
        },

        getTemplateContent: function (jsonld) {
            var templContent = {
                eval: null,
                persons: []
            };
            jsonld['@graph'].forEach(function (obj) {
                if (obj.type === 'evaluation') {
                    templContent.eval = obj;
                } else {
                    templContent.persons.push(obj);
                }
            });

            var critResult = earlReporter.buildCritResults(
                    templContent.eval.auditResult);

            templContent.principles = earlReporter.buildSpec(critResult, wr20specData);

            return templContent;
        },

        buildCritResults: function (auditResult) {
            return auditResult.reduce(function (critResults, assert) {
                if (assert.hasPart.length > 0 ||
                    assert.result.outcome !== 'earl:untested' ||
                    assert.result.description) {

                    critResults[assert.testRequirement] = assert;
                }
                return critResults;
            }, {});
        },

        buildSpec: function (critResults, principles) {
            // Give a hasResult property to all p/c/g & assign the assertions
            principles.forEach(function (principle) {
                principle.hasResult = principle.guidelines
                .reduce(function (hasResult, guideline) {

                    guideline.hasResult = guideline.criteria
                    .reduce(function (hasResult, criterion) {

                        criterion.hasResult = !!critResults[criterion.uri];
                        if (criterion.hasResult) {
                            criterion.assertion = critResults[criterion.uri];
                        }
                        return hasResult || criterion.hasResult;
                    }, false);

                    return hasResult || guideline.hasResult;
                }, false);
            });
            return principles;
        }
    };


    if(_nodejs) {
        // export nodejs API
        module.exports = earlReporter;
    } else if(_browser) {
        window.earlReporter = earlReporter;
    }
}());