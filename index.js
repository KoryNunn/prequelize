
/*
    # Prequelize

    sequelize with less "features".

    ## Why

    Sequelize has a clunky, promise API, and the `where` and `include`
    pattern is extremely dificult to follow, for no apparent reason.

    Prequelize simplifies this significantly by not providing features
    that almost never get used.
*/



var parseSettings = require('./parseSettings'),
    transformData = require('./transformData'),
    format = require('./format'),
    righto = require('righto'),
    abbott = require('abbott'),
    errors = require('generic-errors'),
    merge = require('flat-merge'),
    extend = require('cyclic-deep-extend'),
    util = require('util'),
    oneResultOrError = require('./oneResultOrError');

function extendSettings(settings, extendedSettings){
    settings = merge({}, settings || {});
    extendedSettings = extendedSettings || {};
    settings.where = extend(settings.where, extendedSettings.where || {});

    if(settings.include && settings.include === '*'){
        settings.include = {
            $fields: ['*']
        };
    }

    settings.include = extend(settings.include, extendedSettings.include || {});
    return settings;
}

/*
    ## Settings

    the prequelize settings object is basically the same as the sequelize one,
    but with a simplified where and include syntax:

    ```javascript
    {
        // sequelize style settings...
        skip: 0,
        limit: 10,
        order: [['name', 'DESC']],

        // simplified where:
        where:{
            someField: 'x',
            relatedTable:{
                relatedField: 'y'
            }
        }

        // seperate, simple include:
        include:{

            // Either a list of included fields
            $fields: ['id', 'name', 'someField'],

            // Or keys, with a truthy value
            age: true,

            // With related tables nested.
            relatedTable: {
                $fields: ['relatedField']
            }
        }
    }
    ```
*/

/*
    ## API

    All prequelize model methods take a callback as the last parameter,
    and return a `righto`.

    If no callback is passed, the operation will not be run until
    the returned righto is run.

    see [righto](https://github.com/KoryNunn/righto) for more info.

    example:

    Using normal callbacks:

    ```
        // Get a person with a callback,
        // Executes immediately
        prequelize.Person.get(
            123,
            {
                include: {
                    $fields: ['firstName']
                }
            },
            function(error, person){

            }
        );
    ```

    Using the returned righto:

    ```
        // Get a person righto, does not execute until used.
        var person = prequelize.Person.get(
                123,
                {
                    include: {
                        $fields: ['firstName']
                    }
                }
            );

        // Execute the query and get the resut.
        person(function(error, person){

        });
    ```
*/

function checkArgs(settings, callback){
    if(typeof settings === 'function' && !righto.isRighto(settings)){
        callback = settings;
        settings = null;
    }

    return {
        settings: settings,
        callback: callback
    };
}

/*
    ## Get.

    Get exactly one result by ID.

    If no results are found, the call will be rejected with an Error with code 404.
*/
function get(id, settings, callback){
    var checked = checkArgs(settings, callback);
    settings = checked.settings;
    callback = checked.callback;

    settings = extendSettings(settings, {
        where: {
            id: id
        }
    });

    return findOne.call(this, settings, callback);
}

/*
    ```
    prequelize.Person.get(
        123,
        {
            where:{
                enabled: true
            },
            include: {
                $fields: ['firstName', 'surname']
            }
        },
        callback
    )
    ```
*/

/*
    ## Find.

    Find the first result of a query.

    If no results are found, the call will be resolved no result.
*/
function find(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings, {
        limit: 1,
        transaction: settings.transaction
    });

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    var sequelizeResult = righto.from(prequelizeModel.model.find.bind(prequelizeModel.model), sequelizeSettings);

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

    var sequelizeResult = righto.from(prequelizeModel.model.findAll.bind(prequelizeModel.model), sequelizeSettings);

    var result = righto.all(righto.sync(function(result) {
        return result.map(function(row) {
            return righto(format, row, prequelizeModel);
        });
    }, sequelizeResult));

    callback && result(callback);

    return result;
}

/*
    ## Find And Count All.

    Find and count all results of a query.
*/
function findAndCountAll(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    var sequelizeResult = righto.from(prequelizeModel.model.findAndCountAll.bind(prequelizeModel.model), sequelizeSettings);

    var result = righto.resolve({
        count: sequelizeResult.get('count'),
        rows: righto.all(righto.sync(function(result) {
            return result.rows.map(function(row) {
                return righto(format, row, prequelizeModel);
            });
        }, sequelizeResult))
    });

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

    settings = extendSettings(settings, {
        limit: 2
    });

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    var sequelizeResult = righto.from(prequelizeModel.model.findAll.bind(prequelizeModel.model), sequelizeSettings);

    var result = righto(oneResultOrError, sequelizeResult, prequelizeModel, settings);

    callback && result(callback);

    return result;
}

/*
    ## Find And Remove.

    Remove all results of a query.
*/
function findAndRemove(settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    var sequelizeResult = righto.from(prequelizeModel.model.destroy.bind(prequelizeModel.model), sequelizeSettings);

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
            righto.sync(function(){
                return prequelizeModel.model.sequelize.transaction();
            });

    function resolveResult(removeTransaction, done){
        sequelizeSettings.transaction = settings.transaction || removeTransaction;

        var sequelizeResult = righto.from(prequelizeModel.model.destroy.bind(prequelizeModel.model), sequelizeSettings);

        var deleteResult = righto(format, sequelizeResult, prequelizeModel);

        deleteResult(function(error, result){
            if(error){
                if(removeTransaction){
                    return abbott(removeTransaction.rollback())(function(){
                        done(error, affected);
                    });
                }

                return done(error);
            }

            var affected = result[0];

            if(affected > 1){
                console.error('Error. Model:', prequelizeModel.name, 'Update settings:', util.inspect(settings, { showHidden: true, depth: 6 }));
                throw new Error('Expected only 1 affected row, instead affected ' + affected);
            }

            function checkOne(error, affected){
                if(error || affected < 1){
                    return done(error || new errors.NotFound());
                }

                done(null, affected);
            }

            if(removeTransaction){
                return abbott(removeTransaction.commit())(function(commitError){
                    checkOne(commitError, affected);
                });
            }

            checkOne(null, affected);
        });
    }

    var result = righto(resolveResult, removeTransaction);

    callback && result(callback);

    return result;
}


/*
    ## Remove.

    Remove exactly one result by ID.

    If no results are found, the call will be rejected with an Error with code 404.
*/

function remove(id, settings, callback){
    var checked = checkArgs(settings, callback);
    settings = checked.settings;
    callback = checked.callback;

    settings = extendSettings(settings, {
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
    var checked = checkArgs(settings, callback);
    settings = checked.settings;
    callback = checked.callback;

    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    var sequelizeResult = righto.from(prequelizeModel.model.create.bind(prequelizeModel.model),
            transformData(data, prequelizeModel, prequelizeModel.settings.transformProperty.to),
            sequelizeSettings
        );

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Find One Or Create.

    Find one or Create a record.
*/
function findOneOrCreate(data, settings, callback){
    var prequelizeModel = this;

    var found = righto(prequelizeModel.findOne, settings);

    var createHandle = righto.handle(found, function(error, done){
            if(error instanceof errors.NotFound){
                return prequelizeModel.create(data, settings, done);
            }

            done(error);
        });

    callback && createHandle(callback);

    return createHandle;
}

/*
    ## Bulk Create.

    Bulk create records.
*/
function bulkCreate(data, settings, callback){
    var checked = checkArgs(settings, callback);
    settings = checked.settings;
    callback = checked.callback;

    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    var sequelizeResult = righto.from(prequelizeModel.model.bulkCreate.bind(prequelizeModel.model),
            transformData(data, prequelizeModel, prequelizeModel.settings.transformProperty.to),
            sequelizeSettings
        );

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

/*
    ## Find And Update.

    Update all results of a query.
*/
function findAndUpdate(data, settings, callback){
    var checked = checkArgs(settings, callback);
    settings = checked.settings;
    callback = checked.callback;

    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel);

    var sequelizeResult = righto.from(prequelizeModel.model.update.bind(prequelizeModel.model),
            transformData(data, prequelizeModel, prequelizeModel.settings.transformProperty.to),
            sequelizeSettings
        );

    var result = righto(format, sequelizeResult, prequelizeModel);

    callback && result(callback);

    return result;
}

function findManyAndUpdate(count, data, settings, callback){
    var prequelizeModel = this;

    settings = extendSettings(settings);

    var sequelizeSettings = parseSettings(settings, prequelizeModel),
        updateTransaction = settings.transaction ?
            null :
            righto.sync(function(){
                return prequelizeModel.model.sequelize.transaction();
            });

    function resolveResult(updateTransaction, done){
        sequelizeSettings.transaction = settings.transaction || updateTransaction;

        var matchedRows = righto.from(prequelizeModel.model.findAll.bind(prequelizeModel.model),
                sequelizeSettings
            );

        var matchedIds = matchedRows.get(function(matched){
                if(matched.length > count){
                    console.error('Error. Model:', prequelizeModel.name, 'Update settings:', util.inspect(settings, { showHidden: true, depth: 6 }));
                    throw new Error('Expected only ' + count + ' affected row/s, instead affected ' + matched.length + 'on ');
                }

                if(matched.length < count){
                    return righto.fail(new errors.Unprocessable('Expected ' + count + ' matched ' + matched.length));
                }

                return matched.map(function(item){
                    if(item.dataValues.id == null){
                        console.error('Error. Model:', prequelizeModel.name, 'Update settings:', util.inspect(settings, { showHidden: true, depth: 6 }));
                        throw new Error('prequelize can\'t update tables without an ID.');
                    }

                    return item.dataValues.id;
                });
            });

        var sequelizeUpdateSettings = matchedIds.get(function(ids){
                return {
                    where: {
                        id: ids
                    },
                    transaction: sequelizeSettings.transaction
                };
            });

        var sequelizeResult = righto.from(prequelizeModel.model.update.bind(prequelizeModel.model),
                transformData(data, prequelizeModel, prequelizeModel.settings.transformProperty.to),
                sequelizeUpdateSettings
            );

        var updateResult = righto(format, sequelizeResult, prequelizeModel);

        var transactionComplete = righto(function(done){
                updateResult(function(error){
                    if(updateTransaction){
                        if(error){
                            return abbott(updateTransaction.rollback())(function(transactionError){
                                done(transactionError || error);
                            });
                        }

                        return abbott(updateTransaction.commit())(done);
                    }

                    done(error);
                });
            });

        var result = righto.mate(updateResult, righto.after(transactionComplete));

        result(done);
    }

    var result = righto(resolveResult, updateTransaction);

    callback && result(callback);

    return result;
}

/*
    ## Find And Update One.

    Update exactly one result of a query.

    If no results are found, the call will be rejected with an Error with code 404.

    If more than one result is found, the call will throw.
*/
function findOneAndUpdate(data, settings, callback){
    return findManyAndUpdate.call(this, 1, data, settings, function(error, result) {
        if (error) {
            if (error instanceof errors.Unprocessable) {
                return callback(new errors.NotFound());
            }

            return callback(error);
        }

        callback(null, result);
    });
}

/*
    ## Update.

    Update exactly one result by ID.

    If no results are found, the call will be rejected with an Error with code 404.
*/
function update(id, data, settings, callback){
    var checked = checkArgs(settings, callback);
    settings = checked.settings;
    callback = checked.callback;

    settings = extendSettings(settings, {
        where: {
            id: id
        }
    });

    return findOneAndUpdate.call(this, data, settings, callback);
}

/*
    ## Update Many.

    Update exactly the length of the ids array passed in.

    If less than this is updated, the call will be rejected with an Error with code 422 (Unprocessable).
*/
function updateMany(ids, data, settings, callback){
    var checked = checkArgs(settings, callback);
    settings = checked.settings;
    callback = checked.callback;

    settings = extendSettings(settings, {
        where: {
            id: ids
        }
    });

    return findManyAndUpdate.call(this, ids.length, data, settings, callback);
}

/*
    ## Find One And Update Or Create.

    Find one and Update or Create a record.
*/
function findOneAndUpdateOrCreate(data, settings, callback){
    var prequelizeModel = this;

    var found = righto(prequelizeModel.findOneAndUpdate, data, settings);

    var createHandle = righto.handle(found, function(error, done){
            if(error instanceof errors.NotFound){
                return prequelizeModel.create(data, settings, done);
            }

            done(error);
        });

    callback && createHandle(callback);

    return createHandle;
}

var defaultTransformProperty = {
    to: function(data){
        return data;
    },
    from: function(data){
        return data;
    }
};

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
    prequelizeModel.findOneOrCreate = findOneOrCreate.bind(prequelizeModel);
    prequelizeModel.create = create.bind(prequelizeModel);
    prequelizeModel.bulkCreate = bulkCreate.bind(prequelizeModel);
    prequelizeModel.update = update.bind(prequelizeModel);
    prequelizeModel.updateMany = updateMany.bind(prequelizeModel);
    prequelizeModel.findAndUpdate = findAndUpdate.bind(prequelizeModel);
    prequelizeModel.findOneAndUpdate = findOneAndUpdate.bind(prequelizeModel);
    prequelizeModel.findOneAndUpdateOrCreate = findOneAndUpdateOrCreate.bind(prequelizeModel);

    return prequelizeModel;
}

module.exports = function(models, settings){
    settings = settings || {};
    return Object.keys(models).reduce(function(result, key){
        result[key] = createModelMethods(models[key], key, settings);
        return result;
    }, {});
};

/*

## Querying through associations

Given a through association like so:

```
project = { name, ... }
user = { name, ... }
projectUser = { canCreate }
```

you can just query the assiciation by name:

```
{
    where: {
        name: 'project1',
        user: {
            name: 'bob',
            projectUser: {
              canCreate: true
            }
        }
    }
}
```

## Functions

db functions can be built with a simple expression syntax:

```
models.user.find({
    where: {
        age: {
            $gte: 10
        }
    },
    include: {
        count: {
            $fn: 'count(col("id"))'
        }
    }
});
```
*/