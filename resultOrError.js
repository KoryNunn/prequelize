var errors = require('generic-errors'),
    format = require('./format');

module.exports = function (result, prequelizeModel, callback) {

    if (!result){
        return callback(new errors.NotFound());
    }

    format(result, prequelizeModel, callback);
};