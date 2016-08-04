var getSubModel = require('./getSubModel');

function transformObject(object, propertyName, model, settings, transformPropertyFn){
    if (object instanceof Date) {
        return object;
    }

    var result = Array.isArray(object) ? [] : {};

    for(var key in object){
        var subModel = getSubModel(key, model);
        result[key] = transform(object[key], key, model, subModel, settings, transformPropertyFn);
    }

    return result;
}

function transform(data, propertyName, model, subModel, settings, transformPropertyFn){
    if(data && typeof data === 'object'){
        return transformObject(data, propertyName, subModel, settings, transformPropertyFn);
    }

    return transformPropertyFn(data, model, propertyName);
}

module.exports = function(data, prequelizeModel, transformPropertyFn){
    var result = transform(
        data,
        null,
        null,
        prequelizeModel.model,
        prequelizeModel.settings,
        transformPropertyFn
    );

    return result;
};