jQuery(function ($) {

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

        });
    });

});