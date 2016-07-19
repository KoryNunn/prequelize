var parseSettings = require('./parseSettings'),
    transformData = require('./transformData'),
    format = require('./format'),
    righto = require('righto'),
    abbott = require('abbott'),
    errors = require('generic-errors'),
    merge = require('flat-merge'),
    extend = require('cyclic-deep-extend'),
    oneResultOrError = require('./oneResultOrError'),
    resultOrError = require('./resultOrError');

function extendSettings(settings, extendedSettings){
    settings = merge({}, settings);
    settings.where = extend({}, settings.where);
    settings.include = extend({}, settings.include);
    return settings;
}

/*
    ## Get.

    Get exactly one result by ID.

    If no results are found, the call will be rejected with an Error with code 404.
*/
function get(id, settings, callback){
    extendSettings(settings, {
        where: {
            id: id
        }
    });

    return findOne.call(this, settings, callback);
}

/*
    ## Find.

    Find the first result of a query.

    If no results are found, the call will be resolved no result.
*/
function find(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    extend(sequelizeSettings, {
        limit: 1,
        transaction: settings.transaction
    });

    var sequelizeResult = prequelizeModel.model.find(sequelizeSettings);

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Find All.

    Find all results of a query.
*/
function findAll(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    extend(sequelizeSettings, {
        transaction: settings.transaction
    });

    var sequelizeResult = prequelizeModel.model.findAll(sequelizeSettings);

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Find All.

    Find and count all results of a query.
*/
function findAndCountAll(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    extend(sequelizeSettings, {
        transaction: settings.transaction
    });

    var sequelizeResult = prequelizeModel.model.findAndCountAll(sequelizeSettings);

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Find one.

    Find exactly one result of a query.

    If no results are found, the call will be rejected with an Error with code 404.

    If more than one result is found, the call will throw.
*/
function findOne(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    extend(sequelizeSettings, {
        limit: 2,
        transaction: settings.transaction
    });

    var sequelizeResult = prequelizeModel.model.findAll(sequelizeSettings);

    var result = righto(oneResultOrError, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Remove.

    Remove all results of a query.
*/
function findAndRemove(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    extend(sequelizeSettings, {
        transaction: settings.transaction
    });

    var sequelizeResult = prequelizeModel.model.remove(sequelizeSettings);

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Remove One.

    Remove exactly one result of a query.

    If no results are found, the call will be rejected with an Error with code 404.

    If more than one result is found, the call will throw.
*/
function findOneAndRemove(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel),
        removeTransaction = settings.transaction ?
            null :
            prequelizeModel.model.sequelize.transaction();

    extend(sequelizeSettings, {
        transaction: settings.transaction || removeTransaction
    });

    var sequelizeResult = prequelizeModel.model.remove(sequelizeSettings);

    function resolveResult(done){
        var deleteResult = righto(format, sequelizeResult, prequelizeModel);

        deleteResult(function(error, result){
            if(error){
                if(removeTransaction){
                    return abbott(removeTransaction.rollback())(function(){
                        done(error, result);
                    });
                }

                return done(error);
            }

            if(result > 2){
                throw new Error('Expected only 1 affected row, instead affected ' + result);
            }

            function checkOne(error, result){
                if(error || result < 1){
                    return done(error || new errors.NotFound());
                }

                done(null, result);
            }

            if(removeTransaction){
                return abbott(removeTransaction.commit())(function(commitError){
                    checkOne(commitError, result);
                });
            }

            checkOne(null, result);
        });
    }

    var result = righto(resolveResult);

    callback && result(callback);

    return result;
}


/*
    ## Remove.

    Remove exactly one result by ID.

    If no results are found, the call will be rejected with an Error with code 404.
*/

function remove(id, settings, callback){
    extendSettings(settings, {
        where: {
            id: id
        }
    });

    return findOneAndRemove.call(this, settings, callback);
}

/*
    ## Create.

    Create a record.
*/
function create(data, settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    extend(sequelizeSettings, {
        transaction: settings.transaction
    });

    var sequelizeResult = prequelizeModel.model.create(
            transformData(data, prequelizeModel, prequelizeModel.settings.transformProperty.to),
            sequelizeSettings
        );

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Update.

    Update all results of a query.
*/
function findAndUpdate(data, settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    extend(sequelizeSettings, {
        transaction: settings.transaction
    });

    var sequelizeResult = prequelizeModel.model.update(
            transformData(data, prequelizeModel, prequelizeModel.settings.transformProperty.to),
            sequelizeSettings
        );

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Update One.

    Update exactly one result of a query.

    If no results are found, the call will be rejected with an Error with code 404.

    If more than one result is found, the call will throw.
*/
function findOneAndUpdate(data, settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel),
        removeTransaction = settings.transaction ?
            null :
            prequelizeModel.model.sequelize.transaction();

    extend(sequelizeSettings, {
        transaction: settings.transaction || updateTransaction
    });

    var sequelizeResult = prequelizeModel.model.update(sequelizeSettings);

    function resolveResult(done){
        var deleteResult = righto(format, sequelizeResult, prequelizeModel);

        deleteResult(function(error, result){
            if(error){
                if(updateTransaction){
                    return abbott(updateTransaction.rollback())(function(){
                        done(error, result);
                    });
                }

                return done(error);
            }

            if(result > 2){
                throw new Error('Expected only 1 affected row, instead affected ' + result);
            }

            function checkOne(error, result){
                if(error || result < 1){
                    return done(error || new errors.NotFound());
                }

                done(null, result);
            }

            if(updateTransaction){
                return abbott(updateTransaction.commit())(function(commitError){
                    checkOne(commitError, result);
                });
            }

            checkOne(null, result);
        });
    }

    var result = righto(resolveResult);

    callback && result(callback);

    return result;
}

/*
    ## Update.

    Update exactly one result by ID.

    If no results are found, the call will be rejected with an Error with code 404.
*/
function update(id, settings, callback){
    extendSettings(settings, {
        where: {
            id: id
        }
    });

    return findOneAndUpdate.call(this, settings, callback);
}

var defaultTransformProperty = {
    to: function(data){
        return data;
    },
    from: function(data){
        return data;
    }
}

function createModelMethods(model, modelName, settings) {
    var modelSettings = settings.modelSettings && settings.modelSettings[modelName],
        prequelizeModel = {
            name: modelName,
            prequelizeSettings: settings,
            settings: {
                transformProperty:
                    settings.transformProperty ||
                    defaultTransformProperty
            },
            model: model
        };

    prequelizeModel.get = get.bind(prequelizeModel);
    prequelizeModel.find = find.bind(prequelizeModel);
    prequelizeModel.findAll = findAll.bind(prequelizeModel);
    prequelizeModel.findAndCountAll = findAndCountAll.bind(prequelizeModel);
    prequelizeModel.findOne = findOne.bind(prequelizeModel);
    prequelizeModel.remove = remove.bind(prequelizeModel);
    prequelizeModel.findAndRemove = findAndRemove.bind(prequelizeModel);
    prequelizeModel.findOneAndRemove = findOneAndRemove.bind(prequelizeModel);
    prequelizeModel.create = create.bind(prequelizeModel);
    prequelizeModel.update = update.bind(prequelizeModel);
    prequelizeModel.findAndUpdate = findAndUpdate.bind(prequelizeModel);
    prequelizeModel.findOneAndUpdate = findOneAndUpdate.bind(prequelizeModel);

    return prequelizeModel;
}

module.exports = function(models, settings){
    settings = settings || {};
    return Object.keys(models).reduce(function(result, key){
        result[key] = createModelMethods(models[key], key, settings);
        return result;
    }, {});
};