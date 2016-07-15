var ID = 'id';

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
            include: {},
            model: model,
            required: false
        },
        keys = uniqueKeys([where, include, model.tableAttributes]);

    if (alias) {
        result.as = alias;
    }

    keys.forEach(function(key){
        var subModel = model.associations && model.associations[key] && model.associations[key].target;

        if(typeof where === 'object' && key in where && !subModel){
            result.where[key] = settings.transformProperty.to(where[key], model, key);
            result.required = true;
        }

        if(include && !subModel && (include === true || include[key])){
            result.attributes.push(key);
        }

        if(key === ID && !~result.attributes.indexOf(ID)) {
            result.attributes.push(key);
        }

        if(subModel){
            // another check here could be model.associations[key].isSelfAssociation however the as is a generic thingy that isnt limited to selfassociations
            var alias = model.associations[key].isAliased ? model.associations[key].as : false;

            result.include[key] = buildQuery(
                settings,
                where && where[key],
                include && include[key],
                subModel,
                alias
            );
        }
    });

    result.include = Object.keys(result.include).map(function(key){
        return result.include[key];
    });

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