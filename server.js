var hapi = require('hapi'),
    routes = require('./routes');

// Create a server with a host and port
var server = new hapi.Server();

server.connection({
    host: 'localhost',
    port: 9000
});

server.route(routes.endpoints);

// Start the server
server.start(function () {
    console.log('Server running at: ', server.info.uri);
});