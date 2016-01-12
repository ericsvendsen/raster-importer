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
                var cmd = 'curl --user admin:geoserver --form "file=@' + path + '" http://localhost/geoserver/rest/workspaces/mosaic/coveragestores/scale/external.imagemosaic';
                exec(cmd, { maxBuffer: 314572800 }, function (error, stderr, stdout) {
                    if (error) {
                        reply(boom.expectationFailed(error, stderr));
                    }
                    reply('Success' + JSON.stringify(stdout));
                });
            });
        }
    }
};