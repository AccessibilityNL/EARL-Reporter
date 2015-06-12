jQuery(function ($) {
    var context = {
        "@vocab": "http://www.w3.org/TR/WCAG-EM/#",
        "wcag20": "http://www.w3.org/TR/WCAG20/#",
        "earl": "http://www.w3.org/ns/earl#",
        "dct": "http://purl.org/dc/terms/",
        "reporter": "https://github.com/w3c/wcag-em-report-tool/blob/master/dataformat.md#",
        "conformanceTarget": {
          "id": "step1b",
          "type": "id"
        },
        "evaluationScope": {"id": "step1"},
        "accessibilitySupportBaseline": {"id": "step1c"},
        "additionalEvalRequirement": {"id": "step1d"},
        "siteScope": {"id": "step1a"},
        "commonPages": {"id": "step2a"},
        "essentialFunctionality": {"id": "step2b"},
        "pageTypeVariety": {"id": "step2c"},
        "otherRelevantPages": {"id": "step2e"},
        "structuredSample": {"id": "step3a"},
        "randomSample": {"id": "step3b"},
        "specifics": {"id": "step5b"},
        "auditResult": {"id": "step4"},
        "outcome": {"type": "id"},
        "subject": {"type": "id"},
        "assertedBy": {"type": "id"},
        "testRequirement": {"type": "id"},
        "creator": {"type": "id"},
        "handle": "reporter:handle",
        "description": "reporter:description",
        "tested": "reporter:tested",
        "id": "@id",
        "type": "@type",
        "title": "dct:title",
        "hasPart": "dct:hasPart",
        "specs": "@id",
        "reliedUponTechnology": "wcag20:reliedupondef"
    };

    $('#transform').on('click', function () {
        // Load the template file
        var tplPath = 'reports/' + $('#template').val() + '/main.hds';
        $.get(tplPath).done(function (templateString) {
            // Parse the JSON and put it in the template
            var template = Handlebars.compile(templateString);
            var input = JSON.parse(
                $('#in').val()
            );

            try {
                jsonld.compact(input, context, function (err, jsonld) {
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

                    console.log(templContent);
                    $('#out').val(template(templContent));
                });

            } catch (e) {
                $('#out').val(input);
            }

        });
    });

});