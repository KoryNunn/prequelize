var getSubModel = require('./getSubModel');
var parseFn = require('./parseFn');

function uniqueKeys(objects){
    return Object.keys(objects.reduce(function(result, object){
        for(var key in object){
            result[key] = true;
        }
        return result;
    }, {}));
}

function distinct(items){
    var keys = {};

    return items.filter(function(string){
        if(keys[string]){
            return;
        }

        return keys[string] = true;
    });
}

function buildQuery(settings, where, include, model, throughModel, alias){

    if(include === '*'){
        include = {
            $fields: ['*']
        };
    }

    if(include && include.$fields){

        if(include.$fields = '*'){
            include['*'] = true;
        }else{
            include.$fields.forEach(function(field){
                include[field] = true;
            });
        }

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
            if(include && typeof include[key] === 'object' && '$fn' in include[key]){
                result.attributes.push([parseFn(model.sequelize, key, include[key].$fn), key]);
            }else{
                result.attributes.push(key);
            }
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
    };

    result.attributes = distinct(result.attributes);

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