var Path = require('path'),
    Hapi = require('hapi'),
    Routes = require('./routes');

// Create a server with a host and port
var server = new Hapi.Server();

//server.register([require('vision'), require('inert')], function (err) {
//    server.views({
//        engines: {
//            html: require('handlebars')
//        },
//        relativeTo: __dirname,
//        path: './templates'
//    });
//});

server.connection({
    host: 'localhost',
    port: 9000
});

server.route(Routes.endpoints);

// Start the server
server.start(function () {
    console.log('Server running at: ', server.info.uri);
});