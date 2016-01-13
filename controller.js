var boom = require('boom'),
    hapi = require('hapi'),
    fs = require('fs'),
    exec = require('child_process').exec,
    async = require('async');

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
                //var cmd = 'curl -v -u admin:geoserver --form "file=@' + path + '" http://localhost/geoserver/rest/workspaces/scale/coveragestores/scale/external.geotiff';
                //var cmd = 'raster2pgsql -s 4326 -I -C -M ' + path + ' -F public.products | psql -d scale';
                var cmd = '';
                async.series([
                    function (callback) {
                        cmd = 'curl -u admin:geoserver -v -XPOST -H "Content-Type: application/xml" -d "<coverageStore><name>products</name><workspace>scale</workspace><enabled>true</enabled></coverageStore>" http://localhost/geoserver/rest/workspaces/scale/coveragestores';
                        exec(cmd, function (error, stderr, stdout) {
                            if (error) {
                                reply(boom.expectationFailed(error, stderr));
                            }
                        });
                        callback();
                    }
                ],
                function () {
                    cmd = 'curl -u admin:geoserver -v -XPUT -H "Content-type: image/tiff" -d "uploads/' + name + '" http://localhost/geoserver/rest/workspaces/scale/coveragestores/products/external.geotiff';
                    exec(cmd, { maxBuffer: 314572800 }, function (error, stderr, stdout) {
                        if (error) {
                            reply(boom.expectationFailed(error, stderr));
                        }
                        reply(JSON.stringify(stdout));
                    });
                });
            });
        }
    }
};