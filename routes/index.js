var express      = require('express');
var jsonld       = require('../public/scripts/jsonld');
var context      = require('../public/scripts/context');
var wr20specData = require('../public/scripts/wr20specdata');
var handlebars   = require('handlebars');
var fs           = require('fs');
var router       = express.Router();

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
	var tplPath = 'public/reports/default/main.hds';


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
