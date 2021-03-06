var util = require('util'),
    errors = require('generic-errors'),
    format = require('./format');

module.exports = function (result, prequelizeModel, settings, callback) {
    if (result.length > 1){
        console.error('Error. Model:', prequelizeModel.name, 'settings', util.inspect(settings, { showHidden: true, depth: 6 }));
        throw new Error('Expected only 1 result, instead received ' + result.length);
    }

    if (result.length === 0){
        return callback(new errors.NotFound());
    }

    format(result[0], prequelizeModel, callback);
};