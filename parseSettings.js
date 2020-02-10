var getSubModel = require('./getSubModel');
var parseFn = require('./parseFn');
var invalidKeyRegex = /^\$/;

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

function buildQuery(settings, excludePrimaryKey, where, include, group, model, throughModel, alias){

    if(include === '*'){
        include = {
            $fields: ['*']
        };
    }

    if(include && include.$fields){

        if(include.$fields === '*'){
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
            attributes: group || excludePrimaryKey ? [] : [model.primaryKeyField],
            model: model,
            required: false
        },
        keys = uniqueKeys([where, include, model.tableAttributes]),
        whereIsObject = typeof where === 'object';

    if (whereIsObject) {
        // new sequelize operators are symbols so they must be iterated over and copied separately from the enumerable properties
        Object.getOwnPropertySymbols(where).forEach(function(symbol) {
            result.where[symbol] = where[symbol];
        });
    }

    if(where && throughModel && throughModel.name in where){
        result.through = buildQuery(
            settings,
            excludePrimaryKey,
            where[throughModel.name],
            include && include[throughModel.name],
            group,
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

        if(whereIsObject && key in where && !subModel){
            result.where[key] = settings.transformProperty.to(where[key], model, key);
            result.required = true;
        }

        if(key !== '*' && !invalidKeyRegex.test(key) && include && !subModel && (include === true || include[key] || include['*'])){
            if(include && typeof include[key] === 'object' && '$fn' in include[key]){
                result.attributes.push([parseFn(model.sequelize, key, include[key].$fn), key]);
            }else{
                result.attributes.push(key);
            }
        }

        if(subModel && (where && where[key] || include && include[key])){

            // another check here could be model.associations[key].isSelfAssociation however the as is a generic thingy that isnt limited to selfassociations
            var alias = subModel.isAliased ? subModel.as : false;
            result.required = result.required || !!(where && where[key]);

            includeResult[key] = buildQuery(
                settings,
                excludePrimaryKey,
                where && where[key],
                include && include[key],
                group,
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

    result.attributes = distinct(result.attributes);

    return result;
}

function parseSettings(settings, prequelizeModel){
    var sequelizeSettings = buildQuery(
        prequelizeModel.settings,
        settings.excludePrimaryKey,
        settings.where,
        settings.include,
        settings.group,
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