var Controller = require('./controller');

exports.endpoints = [
    {
        method: 'GET',
        path: '/api/testendpoint',
        config: Controller.testEndpoint
    }
];