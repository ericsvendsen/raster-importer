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
                reply(boom.badImplementation(err)); // 500 error
            });

            data.file.pipe(file);

            data.file.on('end', function () {
                var cmd = 'raster2pgsql -s 4326 -I -C -M uploads/' + data.file.hapi.filename + ' -F -t 100x100 public.products | psql -d scale';
                exec(cmd, function (error, stdout) {
                    if (error) {
                        reply(boom.badImplementation(error)); // 500 error
                    }
                    reply(JSON.stringify(stdout));
                });
            });
        }
    }
};