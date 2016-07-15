var toJsonObject = require('object-tojson'),
    transformData = require('./transformData');

module.exports = function(sequelizeResult, prequelizeModel, callback){
    var rawData = toJsonObject(sequelizeResult);

    if(sequelizeResult && sequelizeResult.sequelize){
        return callback(null, transformData(rawData, prequelizeModel, prequelizeModel.settings.transformProperty.from));
    }

    callback(null, rawData);
};
