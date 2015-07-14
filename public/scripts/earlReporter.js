(function() {
    // determine if in-browser or using node.js
    var _nodejs = (
        typeof process !== 'undefined' && process.versions && process.versions.node);
    var _browser = !_nodejs &&
        (typeof window !== 'undefined' || typeof self !== 'undefined');


    // Get external dependencies
    var Handlebars   = (_nodejs ? require('handlebars') : window.Handlebars);
    var jsonld       = (_nodejs ? require('./jsonld') : window.jsonld);
    var context      = (_nodejs ? require('./context') : window.context);
    var wr20specData = (_nodejs ? require('./wr20specdata') : window.wr20specData);


    // search/replace in string
    // this might be an alternative: http://formatjs.io/handlebars/ - but we need to upgrade node to something higher than version 0.10
    Handlebars.registerHelper('dutchDate', function(input) {
      var months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
      var parts = Handlebars.escapeExpression(input).split('-');
      var output = '';

      if(parts.length === 3) {
        output = parseInt(parts[2], 10)+' '+months[parseInt(parts[1], 10) - 1]+' '+parts[0];
      }

      return new Handlebars.SafeString(
        output
      );
    });

    // create link from string
    Handlebars.registerHelper('link', function(string) {
      var url = Handlebars.escapeExpression(string);

      return new Handlebars.SafeString(
        "<a href='" + url + "'>" + url + "</a>"
      );
    });

    // turn string into list
    Handlebars.registerHelper('list', function(string) {
      string = Handlebars.escapeExpression(string);
      var items = string.split("\n");
      var list = '';

      items.forEach(function(item) {
        list += '<li>'+item+'</li>';
      });

      return new Handlebars.SafeString(list);
    });

    // add lengths of arrays together
    Handlebars.registerHelper('count', function() {
      var i;
      var count = 0;

      for (i = 0; i < arguments.length - 1; i += 1) {
        if(Array.isArray(arguments[i])) {
          count += arguments[i].length;
        }
      }

      return count;
    });

    // parse string to HTML (add links, paragraphs and break elements)
    Handlebars.registerHelper('html', function(string) {
      string = Handlebars.escapeExpression(string);
      var tmp;
      var html = '';

      // add links
      tmp = [];
      string.split(' ').forEach(function(word) {
        if(word.indexOf('www.') === 0) {
          word = 'http://'+word;
        }

        if(word.indexOf('http://') === 0 || word.indexOf('https://') === 0) {
          word = '<a href="'+word+'">'+word+'</a>';
        }

        tmp.push(word);
      });
      string = tmp.join(' ');

      // create paragraphs
      string.split("\n\n").forEach(function(paragraph) {
        html += '<p>'+paragraph+'</p>';
      });

      // create line breaks
      html.replace(
        SearchRegEx = new RegExp(
          "\n".replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'
        ), '<br/>'
      );
      return new Handlebars.SafeString(html);
    });


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
    } else if(typeof define === 'function' && define.amd) {
        // export AMD API
        define([], function() {
            return earlReporter;
        });
    } else if(_browser) {
        window.earlReporter = earlReporter;
    }

}());