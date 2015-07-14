jQuery(function ($) {
    var context = window.context;

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

        // Give a hasResult property to all principle / guideline / criterion
        // Also add assertion to the criterion
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


    // Post to the server
    $('#transform-server').on('click', function () {
        $.ajax({
            url: "build-report?template=default",
            type: "POST",
            data: $('#in').val(),
            contentType : 'application/json',
            dataType: "html"
        }).done(function (data) {

            $('#out').val("Server said:\n" + data);
        });
    });

    // Build it client side
    $('#transform-local').on('click', function () {
        // Load the template file
        var tplPath = 'reports/' + $('#template').val() + '/main.hds';


        $.get(tplPath).done(function (templateString) {
            var jsonSource = JSON.parse($('#in').val());

            earlReporter.createReport(templateString, jsonSource,
            function (err, htmlReport) {
                var out = (htmlReport ? "Client said:\n" + htmlReport: err.toString());
                $('#out').val(out);
            });



            // Parse the JSON and put it in the template
            // var template = Handlebars.compile(templateString);

            // try {
            //     jsonld.compact(input, context, function (err, jsonld) {
            //         var templContent = {
            //             eval: null,
            //             persons: [],
            //             principles: wr20specData
            //         };

            //         jsonld['@graph'].forEach(function (obj) {
            //             if (obj.type === 'evaluation') {
            //                 templContent.eval = obj;
            //             } else {
            //                 templContent.persons.push(obj);
            //             }
            //         });

            //         templContent.principles = buildSpec(templContent.eval.auditResult,
            //                                             wr20specData);

            //         $('#out').val(
            //             "Client said:\n" +
            //             template(templContent)
            //         );
            //     });

            // } catch (e) {
            //     $('#out').val(input);
            // }

        });
    });

});