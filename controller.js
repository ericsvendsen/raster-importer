var boom = require('boom'),
    hapi = require('hapi'),
    fs = require('fs'),
    exec = require('child_process').exec,
    async = require('async'),
    noderequest = require('request');

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
                zipName = name.split('.')[0],
                path = __dirname + '/uploads/' + name,
                file = fs.createWriteStream(path),
                layer = data.layer;

            file.on('error', function (err) {
                console.error(err);
                reply(boom.expectationFailed(err));
            });

            data.file.pipe(file);

            data.file.on('end', function () {
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
                        cmd = 'curl -v -u admin:geoserver -XPOST -H "Content-Type: text/xml" -d "<coverageStore><name>' + data.layer + '</name><workspace>scale</workspace><enabled>true</enabled></coverageStore>" http://localhost/geoserver/rest/workspaces/scale/coveragestores';
                        exec(cmd, function (error, stderr, stdout) {
                            if (error) {
                                reply(boom.expectationFailed(error, stderr));
                            } else {
                                callback();
                            }
                        });
                    },
                    // zip file
                    function (callback) {
                        cmd = 'zip uploads/' + zipName + '.zip uploads/' + name;
                        exec(cmd, function (error, stderr, stdout) {
                            if (error) {
                                reply(boom.expectationFailed(error, stderr));
                            } else {
                                callback();
                            }
                        });
                    },
                    // upload file
                    function (callback) {
                        cmd = 'curl -v -u admin:geoserver -XPUT -H "Content-type: application/zip" --data-binary @uploads/' + zipName + '.zip http://localhost/geoserver/rest/workspaces/scale/coveragestores/' + data.layer + '/file.geotiff';
                        exec(cmd, { maxBuffer: 314572800 }, function (error, stderr, stdout) {
                            if (error) {
                                reply(boom.expectationFailed(error, stderr));
                            } else {
                                callback(null, stdout);
                            }
                        });
                    }
                ],
                function (err, results) {
                    // cleanup
                    cmd = 'sudo rm uploads/' + name + ' && sudo rm uploads/' + zipName + '.zip';
                    exec(cmd, function (error, stderr, stdout) {
                        if (error) {
                            reply(boom.expectationFailed(error, stderr));
                        } else {
                            reply(JSON.stringify(results));
                        }
                    });
                });
            });
        }
    }
};

exports.createMosaic = {
    payload: {
        output: 'data',
        parse: true
    },
    handler: function (request, reply) {
        var data = request.payload;

        if (data.mosaic) {
            var cmd = '';
            async.series([
                // check if workspace exists
                function (callback) {
                    noderequest('http://admin:geoserver@localhost/geoserver/rest/workspaces/scale', function (error, response, body) {
                        if (error) {
                            reply(boom.expectationFailed(error, stderr));
                        } else {
                            if (response.statusCode !== 200) {
                                // create workspace
                                cmd = 'curl -v -u admin:geoserver -XPOST -H "Content-type: text/xml" -d "<workspace><name>scale</name></workspace>" http://localhost/geoserver/rest/workspaces'
                                exec(cmd, function (error, stderr, stdout) {
                                    if (error) {
                                        reply(boom.expectationFailed(error, stderr));
                                    } else {
                                        callback();
                                    }
                                });
                            } else {
                                callback();
                            }
                        }
                    });
                },
                // check if coveragestore exists
                function (callback) {
                    noderequest('http://admin:geoserver@localhost/geoserver/rest/workspaces/scale/coveragestores/' + data.mosaic, function (error, response, body) {
                        if (error) {
                            reply(boom.expectationFailed(error, stderr));
                        } else {
                            if (response.statusCode !== 200) {
                                // create coveragestore
                                cmd = 'curl -v -u admin:geoserver -XPUT -H "Content-Type: text/xml" -d "<coverageStore><name>' + data.mosaic + '</name><workspace>scale</workspace><enabled>true</enabled></coverageStore>" http://localhost/geoserver/rest/workspaces/scale/coveragestores';
                                exec(cmd, function (error, stderr, stdout) {
                                    if (error) {
                                        reply(boom.expectationFailed(error, stderr));
                                    } else {
                                        callback();
                                    }
                                });
                            } else {
                                callback();
                            }
                        }
                    });
                }
            ],
            function (err, results) {
                if (err) {
                    reply(boom.expectationFailed(err));
                } else {
                    reply();
                }
            });
        }
    }
};

exports.updateMosaic = {
    payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: 314572800 // 300mb
    },
    handler: function (request, reply) {
        var data = request.payload;

        if (data.file) {
            var name = data.file.hapi.filename,
                path = __dirname + '/uploads/' + name,
                file = fs.createWriteStream(path),
                mosaic = data.mosaic;

            file.on('error', function (err) {
                console.log(err);
                reply(boom.expectationFailed(err));
            });

            data.file.pipe(file);

            data.file.on('end', function () {
                var cmd = 'curl -v -u admin:geoserver -XPUT -H "Content-type: text/plain" --data-binary @uploads/' + name + ' http://localhost/geoserver/rest/workspaces/scale/coveragestores/' + data.mosaic + '/external.imagemosaic';
                console.log(cmd);
                exec(cmd, { maxBuffer: 314572800 }, function (error, stderr, stdout) {
                    if (error) {
                        reply(boom.expectationFailed(error, stderr));
                    } else {
                        console.log(stdout);
                        reply();
                    }
                });
            });
        }
    }
};
