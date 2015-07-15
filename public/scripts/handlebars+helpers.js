(function() {
    // determine if in-browser or using node.js
    var _nodejs = (
        typeof process !== 'undefined' && process.versions && process.versions.node);
    var _browser = !_nodejs &&
        (typeof window !== 'undefined' || typeof self !== 'undefined');

    var Handlebars            = (_nodejs ? require('handlebars') : window.Handlebars);
    var HandlebarsWithHelpers = Handlebars;


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



    if(_nodejs) {
        // export nodejs API
        module.exports = HandlebarsWithHelpers;
    } else if(typeof define === 'function' && define.amd) {
        // export AMD API
        define([], function() {
            return HandlebarsWithHelpers;
        });
    } else if(_browser) {
        window.HandlebarsWithHelpers = HandlebarsWithHelpers;
    }

}());