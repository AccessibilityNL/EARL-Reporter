var express      = require('express');
var jsonld       = require('../public/scripts/jsonld');
var context      = require('../public/scripts/context');
var wr20specData = require('../public/scripts/wr20specdata');
var handlebars   = require('handlebars');
var fs           = require('fs');
var router       = express.Router();

/*
  Custom Handlebars Helpers
*/

// search/replace in string
handlebars.registerHelper('replace', function(text, search, replace) {
  var text = handlebars.escapeExpression(text),
      search = handlebars.escapeExpression(search),
      replace = handlebars.escapeExpression(replace),
      SearchRegEx;

  /* see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters */
  SearchRegEx = new RegExp(
    search.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"),
    'g'
  );

  return new handlebars.SafeString(
    text.replace(SearchRegEx, replace)
  );
});

// search/replace in string
// this might be an alternative: http://formatjs.io/handlebars/ - but we need to upgrade node to something higher than version 0.10
handlebars.registerHelper('dutchDate', function(input) {
  var months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var parts = handlebars.escapeExpression(input).split('-');
  var output = '';

  if(parts.length === 3) {
    output = parseInt(parts[2], 10)+' '+months[parseInt(parts[1], 10) - 1]+' '+parts[0];
  }

  return new handlebars.SafeString(
    output
  );
});

// create link from string
handlebars.registerHelper('link', function(string) {
  var url = handlebars.escapeExpression(string);

  return new handlebars.SafeString(
    "<a href='" + url + "'>" + url + "</a>"
  );
});

// turn string into list
handlebars.registerHelper('list', function(string) {
  var string = handlebars.escapeExpression(string);
  var items = string.split("\n");
  var list = '';

  items.forEach(function(item) {
    list += '<li>'+item+'</li>';
  });

  return new handlebars.SafeString(list);
});

// add lengths of arrays together
handlebars.registerHelper('count', function() {
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
handlebars.registerHelper('html', function(string) {
  var string = handlebars.escapeExpression(string);
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



  return new handlebars.SafeString(html);
});


/* GET home page. */
router.get('/', function(req, res) {
    res.render('index');
});

function buildSpec(auditResult, principles) {
    // Create a map with the URI of all none empty assertions
    var critResults = auditResult
    .reduce(function (critResults, assert) {
        if (assert.hasPart.length > 0 ||
            assert.result.outcome !== 'earl:untested' ||
            assert.result.description) {

            critResults[assert.testRequirement] = assert;
        }
        return critResults;
    }, {});

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


router.post('/build-report', function(req, res) {
    var template = req.query.template || 'default';
    var tplPath = 'public/reports/'+template+'/main.hds';


    jsonld.compact(req.body, context, function (err, json) {
        var templContent = {
            eval: null,
            persons: []
        };

        json['@graph'].forEach(function (obj) {
            if (obj.type === 'evaluation') {
                templContent.eval = obj;
            } else {
                templContent.persons.push(obj);
            }
        });

        templContent.principles = buildSpec(templContent.eval.auditResult,
                                                        wr20specData);

        // read the file and use the callback to render
        fs.readFile(tplPath, function(err, templateFile) {
            if (err) {
                res.send(err);
                return;
            }
            // make the buffer into a string, then to a template
            var template = handlebars.compile(templateFile.toString());
            res.send(template(templContent));
        });
    });


});

module.exports = router;
