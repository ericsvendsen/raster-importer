var Controller = require('./controller');

exports.endpoints = [
    {
        method: 'POST',
        path: '/importraster',
        config: Controller.importRaster
    }
];