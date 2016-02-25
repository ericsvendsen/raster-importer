var Controller = require('./controller');

exports.endpoints = [
    {
        method: 'POST',
        path: '/importraster',
        config: Controller.importRaster
    },
    {
        method: 'POST',
        path: '/mosaic',
        config: Controller.createMosaic
    },
    {
        method: 'PUT',
        path: '/mosaic',
        config: Controller.updateMosaic
    }
];
