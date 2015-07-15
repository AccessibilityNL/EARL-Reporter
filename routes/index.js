var express      = require('express');
var earlReporter = require('../public/scripts/earlReporter');
var fs           = require('fs');
var router       = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.post('/build-report', function(req, res) {
    var template = req.query.template || 'default';
    var tplPath = 'public/reports/'+template+'/main.hds';

    // read the file and use the callback to render
    fs.readFile(tplPath, function(err, templateFile) {
        if (err) {
            res.send(err);
            return;
        }
        var jsonSource     = req.body;
        var templateString = templateFile.toString();

        earlReporter.createReport(templateString, jsonSource, function (err, htmlReport) {
            if (htmlReport) {
                res.send(htmlReport);
            } else {
                res.send(err);
            }
        });
    });

});

module.exports = router;
