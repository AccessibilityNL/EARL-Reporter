var router     = require('express').Router();
var fs         = require('fs');
var md5        = require('MD5');
var Handlebars = require('../public/scripts/handlebars+helpers');

/* GET template listing. */
router.get('/:tplName?', function(req, res) {
    var tplName  = req.params.tplName || 'default';
    try {
        fs.readFile('./public/reports/' + tplName + '/main.hds',
                    'utf8', function (err, template) {

            if (err) {
                //res.setHeader(404)
                res.send(err.message);
            } else {
                res.setHeader('content-type', 'text/plain');
                res.send(template);
            }
        });
    } catch (err) {
        throw NotFound();
    }
});


/**
 * To update, make a post request to /tempalates/:templateName?key=[key]
 * where templateName is the directory name of that template
 * and [key] is an md5 hash of templateBody + templateName + salt.
 * The salt is: wTJ4/7KAy8SYbfDBa8F*&9a(g
 */
router.post('/:tplName', function(req, res) {
    var tplName = req.params.tplName;
    var dir     = './public/reports/' + tplName;
    var salt    = 'wTJ4/7KAy8SYbfDBa8F*&9a(g';
    var hash    = req.query.key;

    if (hash !== md5(req.body + tplName + salt)) {
        res.sendStatus(403);
        return;
    }

    // Check if the template compiles
    try {
        var template = Handlebars.compile(req.body);
        console.log(template({}));
    } catch (e) {
        res.sendStatus(400);
        return;
    }

    // Create the directory if it doesn't exist yet
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    // Creat the file
    fs.writeFile(dir + '/main.hds',
                 req.body,
                 function (err) {
        if (err) throw err;
        res.setHeader('content-type', 'text/plain');
        res.send('Template ' + tplName + ' updated.');
    });

});

module.exports = router;
