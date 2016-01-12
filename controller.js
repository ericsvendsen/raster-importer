var boom = require('boom'),
    hapi = require('hapi'),
    fs = require('fs');

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
                var ret = {
                    filename: data.file.hapi.filename,
                    headers: data.file.hapi.headers
                };
                reply(JSON.stringify(ret));
            });
        }
    }
};