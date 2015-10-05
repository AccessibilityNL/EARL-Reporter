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
    var wr20specData = (_nodejs ? require('./wr20specData') : window.wr20specData);


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
            
            // make an object which contains total scores
            templContent.scores = {sum: {success: 0, total: 0}, principles: {}};
            
            // loop through principles
            templContent.principles.forEach(function(principle) {
              if(principle.hasResult) {
                // add principle to scores object
                if(!(principle.title in templContent.scores.principles)) {
                  templContent.scores.principles[principle.title] = {};
                }
                
                // loop through guidelines
                principle.guidelines.forEach(function(guideline) {
                  if(guideline.hasResult) {
                    // loop through criteria
                    guideline.criteria.forEach(function(criterium) {
                      var level;
                      
                      if(criterium.hasResult) {
                        level = criterium.level.split('_').pop().toUpperCase();
                                                
                        // add sum to principle object
                        if(!('sum' in templContent.scores.principles[principle.title])) {
                          templContent.scores.principles[principle.title]['sum'] = {
                            success: 0,
                            total: 0
                          };
                        }
                        
                        // add level to principle object
                        if(!(level in templContent.scores.principles[principle.title])) {
                          templContent.scores.principles[principle.title][level] = {
                            success: 0,
                            total: 0
                          };
                        }
                        
                        // add level to total sum
                        if(!(level in templContent.scores['sum'])) {
                          templContent.scores['sum'][level] = {
                            success: 0,
                            total: 0
                          };
                        }
                        
                        // add one to success if criterium hasn't failed
                        if(criterium.assertion.result.outcome !== 'earl:failed') {
                          templContent.scores.principles[principle.title][level].success += 1;
                          templContent.scores.principles[principle.title]['sum'].success += 1;
                          templContent.scores['sum'][level].success += 1;
                          templContent.scores['sum'].success += 1;
                        }
                        
                        // add one to total
                        templContent.scores.principles[principle.title][level].total += 1;
                        templContent.scores.principles[principle.title]['sum'].total += 1;
                        templContent.scores['sum'][level].total += 1;
                        templContent.scores['sum'].total += 1;
                      }
                    });
                  }
                });
              }
            });
                                    
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
