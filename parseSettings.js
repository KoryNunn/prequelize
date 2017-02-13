var getSubModel = require('./getSubModel');

function uniqueKeys(objects){
    return Object.keys(objects.reduce(function(result, object){
        for(var key in object){
            result[key] = true;
        }
        return result;
    }, {}));
}

function buildQuery(settings, where, include, model, throughModel, alias){
    if(include && include.$fields){
        include.$fields.forEach(function(field){
            include[field] = true;
        });
        delete include.$fields;
    }

    var result = {
            where: {},
            attributes: ['id'],
            model: model,
            required: false
        },
        keys = uniqueKeys([where, include, model.tableAttributes]);

    if(where && throughModel && throughModel.name in where){
        result.through = buildQuery(
            settings,
            where[throughModel.name],
            include && include[throughModel.name],
            throughModel,
            null,
            throughModel.isAliased ? throughModel.as : false
        );
        delete where[throughModel.name];
    }

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

        if(key !== '*' && include && !subModel && (include === true || include[key] || include['*'])){
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
                subModel.throughModel,
                alias
            );
        }
    });

    var includeKeys = Object.keys(includeResult);

    if(includeKeys.length) {
        result.include = includeKeys.map(function(key){
            return includeResult[key];
        });
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

    console.log(require('util').inspect(sequelizeSettings, null, 10));

    return sequelizeSettings;
}

module.exports = parseSettings;