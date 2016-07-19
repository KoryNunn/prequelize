
function getSubModel(property, model){
    if(!model){
        return;
    }

    for(var key in model.associations){
        if((model.associations[key].as || model.associations[key].identifierField) === property){
            return model.associations[key];
        }
    }
}

function transformObject(object, propertyName, model, settings, transformPropertyFn){
    var result = Array.isArray(object) ? [] : {};

    for(var key in object){
        var subModel = getSubModel(key, model);
        result[key] = transform(object[key], key, model, subModel, settings, transformPropertyFn);
    }

    return result;
}

function transform(data, propertyName, model, subModel, settings, transformPropertyFn){
    if(typeof data === 'object'){
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