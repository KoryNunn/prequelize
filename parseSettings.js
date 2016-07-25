var ID = 'id';
var getSubModel = require('./getSubModel');

function uniqueKeys(objects){
    return Object.keys(objects.reduce(function(result, object){
        for(var key in object){
            result[key] = true;
        }
        return result;
    }, {}));
}

function buildQuery(settings, where, include, model, alias){
    var result = {
            where: {},
            attributes: [],
            model: model,
            required: false
        },
        keys = uniqueKeys([where, include, model.tableAttributes]);

    if (alias) {
        result.as = alias;
    }

    var includeResult = {};

    keys.forEach(function(key){
        var subModel = getSubModel(key, model);

        if(typeof where === 'object' && key in where && !subModel){
            result.where[key] = settings.transformProperty.to(where[key], model, key);
            result.required = true;
        }

        if(include && !subModel && (include === true || include[key])){
            result.attributes.push(key);
        }

        if(subModel){
            // another check here could be model.associations[key].isSelfAssociation however the as is a generic thingy that isnt limited to selfassociations
            var alias = subModel.isAliased ? subModel.as : false;
            result.required = true;

            includeResult[key] = buildQuery(
                settings,
                where && where[key],
                include && include[key],
                subModel.target,
                alias
            );
        }
    });

    var includeKeys = Object.keys(includeResult);

    if (includeKeys.length) {

        result.attributes.push(ID);

        result.include = includeKeys.map(function(key){
            return includeResult[key];
        });
    }

    return result;
}

function parseSettings(settings, prequelizeModel){
    return buildQuery(
        prequelizeModel.settings,
        settings.where,
        settings.include,
        prequelizeModel.model
    );
}

module.exports = parseSettings;