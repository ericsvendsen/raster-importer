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
                async.series([
                    function (callback) {
                        exec('curl -v -u admin:geoserver -XPOST -H "Content-type: text/xml" -d "<workspace><name>scale</name></workspace>" http://localhost/geoserver/rest/workspaces/');
                        callback();
                    }
                ],
                function () {
                    var cmd = 'curl -v -u admin:geoserver -XPUT -H "Content-type: image/tiff" --data-binary @uploads/' + name + ' http://localhost/geoserver/rest/workspaces/scale/datastores/products/' + name;
                    exec(cmd, { maxBuffer: 314572800 }, function (error, stderr, stdout) {
                        if (error) {
                            reply(boom.expectationFailed(error, stderr));
                        }
                        reply('Success' + JSON.stringify(stdout));
                    });
                });
            });
        }
    }
};