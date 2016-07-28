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
    if(include && include.$fields){
        include.$fields.forEach(function(field){
            include[field] = true;
        });
        delete include.$fields;
    }

    var hasAttributes = include && !include['*'];

    var result = {
            where: {},
            attributes: hasAttributes && [],
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

        if(hasAttributes && include && !subModel && (include === true || include[key] || include[key])){
            result.attributes.push(key);
        }

        if(subModel && (where && where[key] || include && include[key])){
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

    if(hasAttributes){
        result.attributes.push(ID);

        if(includeKeys.length) {
            result.include = includeKeys.map(function(key){
                return includeResult[key];
            });
        }
    }

    return result;
}

function parseSettings(settings, prequelizeModel){
    var sequelizeSettings = buildQuery(
        prequelizeModel.settings,
        settings.where,
        settings.include,
        prequelizeModel.model
    );

    for(var key in settings){
        if(key === 'where' || key === 'include'){
            continue;
        }

        sequelizeSettings[key] = settings[key];
    }

    return sequelizeSettings;
}

module.exports = parseSettings;