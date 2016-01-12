var boom = require('boom'),
    hapi = require('hapi'),
    fs = require('fs'),
    exec = require('child_process').exec;

exports.importRaster = {
    payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: 314572800 // 300mb
    },
    handler: function (request, reply) {
        // get the raster data
        var data = request.payload;

        if (data.file) {
            var name = data.file.hapi.filename,
                path = __dirname + '/uploads/' + name,
                file = fs.createWriteStream(path);

            file.on('error', function (err) {
                console.error(err);
                reply(boom.expectationFailed(err));
            });

            data.file.pipe(file);

            data.file.on('end', function () {
                var cmd = 'curl --form "file=@' + path + ' http://localhost/geoserver/rest/workspaces/mosaic/coveragestores/viirs-dnb/external.imagemosaic"';
                exec(cmd, function (error, stdout, stderr) {
                    if (error) {
                        reply(boom.expectationFailed(error, stderr));
                    }
                    reply(JSON.stringify(stdout));
                });
            });
        }
    }
};