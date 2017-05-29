var test = require('tape');
var righto = require('righto');

test('create', function(t){

    t.plan(2);

    require('./db')(function(error, models){

        var bobData = {
            name: 'bob',
            age: 50
        };

        var bob = models.user.create(bobData);

        bob(function(error, data){
            t.notOk(error);
            delete data.id;
            delete data.createdAt;
            delete data.updatedAt;
            t.deepEqual(data, bobData);
        });
    });
});

test('findOneOrCreate', function(t){

    t.plan(1);

    require('./db')(function(error, models){

        var bobData = {
            name: 'bob',
            age: 50
        };

        var bob = models.user.findOneOrCreate(bobData, {
                where:{
                    name: 'bob'
                }
            });

        var bobAgain = righto(models.user.findOneOrCreate, bobData, {
                where:{
                    name: 'bob'
                }
            }, righto.after(bob));

        righto.mate(bob.get('id'), bobAgain.get('id'))(function(error, id1, id2){
            t.equal(id1, id2);
        });

    });
});

test('bulkCreate', function(t){

    t.plan(2);

    require('./db')(function(error, models){

        var usersData = [];

        for(var i = 0; i < 50; i++){
            usersData.push({
                name: 'bob' + i,
                age: 50 + i
            });
        }

        var users = models.user.bulkCreate(usersData);

        users(function(error, users){
            t.notOk(error);

            t.equal(users.length, usersData.length);
        });

    });
});