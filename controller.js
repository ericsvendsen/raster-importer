var Boom = require('boom');

exports.testEndpoint = {
    handler: function (request, reply) {
        reply({ hello: 'world' });
        //reply(Boom.badImplementation(err)); // 500 error
    }
};