var test = require('tape');
var righto = require('righto');

test('count', function(t){

    t.plan(2);

    require('./db')(function(error, models){

        var bobData = {
            name: 'bob',
            age: 50
        };
        var bertData = {
            name: 'bert'
        };

        var users = righto(models.user.bulkCreate, [bobData, bertData]);
        var count = righto(models.user.count, righto.after(users));

        count(function(error, data){
            t.notOk(error);
            t.equal(data, 2);
        });
    });
});

test('count with where', function(t){

    t.plan(2);

    require('./db')(function(error, models){

        var bobData = {
            name: 'bob',
            age: 50
        };
        var bertData = {
            name: 'bert'
        };

        var users = righto(models.user.bulkCreate, [bobData, bertData]);
        var count = righto(models.user.count, {where: {name: 'bob'}}, righto.after(users));

        count(function(error, data){
            t.notOk(error);
            t.equal(data, 1);
        });
    });
});