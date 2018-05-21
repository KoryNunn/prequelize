var test = require('tape');
var righto = require('righto');

test('findOne non standard primary key', function(t){
    t.plan(2);

    require('./db')(function(error, models){
        var potatoData = {
            type: 'Kestrel',
            description: 'Long oval shape, creamy flesh, white skin, purple or blue eyes'
        };

        var potato = models.potato.create(potatoData);

        var foundPotato = righto(models.potato.findOne, {
            where: {
                type: potatoData.type
            },
            include: {
                $fields: ['description']
            }
        }, righto.after(potato));

        foundPotato(function(error, data){
            t.notOk(error);

            t.deepEqual(data, potatoData);
        });
    });
});