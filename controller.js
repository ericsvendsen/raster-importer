var boom = require('boom'),
    hapi = require('hapi'),
    fs = require('fs'),
    exec = require('child_process').exec,
    async = require('async'),
    zip = new require('node-zip')();

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
                zipPath = 'uploads/' + name.split('.')[0] + '.zip',
                file = fs.createWriteStream(path);

            file.on('error', function (err) {
                console.error(err);
                reply(boom.expectationFailed(err));
            });

            data.file.pipe(file);

            data.file.on('end', function () {
                // zip file
                zip.file('uploads/' + name);
                var data = zip.generate({ base64: false, compression:'DEFLATE' });
                fs.writeFileSync(zipPath, data, 'binary');

                var cmd = '';
                async.series([
                    // create workspace
                    function (callback) {
                        cmd = 'curl -v -u admin:geoserver -XPOST -H "Content-type: text/xml" -d "<workspace><name>scale</name></workspace>" http://localhost/geoserver/rest/workspaces'
                        exec(cmd, function (error, stderr, stdout) {
                            if (error) {
                                reply(boom.expectationFailed(error, stderr));
                            } else {
                                callback();
                            }
                        });
                    },
                    // create datastore
                    function (callback) {
                        cmd = 'curl -v -u admin:geoserver -XPOST -H "Content-Type: text/xml" -d "<coverageStore><name>products</name><workspace>scale</workspace><enabled>true</enabled></coverageStore>" http://localhost/geoserver/rest/workspaces/scale/coveragestores';
                        exec(cmd, function (error, stderr, stdout) {
                            if (error) {
                                reply(boom.expectationFailed(error, stderr));
                            } else {
                                callback();
                            }
                        });
                    }
                ],
                function () {
                    console.log(zipPath);
                    cmd = 'curl -v -u admin:geoserver -XPUT -H "Content-type: application/zip" --data-binary @' + zipPath + ' http://localhost/geoserver/rest/workspaces/scale/coveragestores/products/file.geotiff';
                    exec(cmd, { maxBuffer: 314572800 }, function (error, stderr, stdout) {
                        if (error) {
                            reply(boom.expectationFailed(error, stderr));
                        } else {
                            reply(JSON.stringify(stdout));
                        }
                    });
                });
            });
        }
    }
};