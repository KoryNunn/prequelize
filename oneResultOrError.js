var errors = require('generic-errors'),
    format = require('./format');

module.exports = function (result, prequelizeModel, callback) {
    if (result.length > 1){
        throw new Error('Expected only 1 result, instead received ' + result.length);
    }

    if (result.length === 0){
        return callback(new errors.NotFound());
    }

    format(result[0], prequelizeModel, callback);
};