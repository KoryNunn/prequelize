var test = require('tape');
var parseFn = require('../parseFn');

var fakePrequelize = {
    fn: function(fnName, arg){
        return [fnName, arg];
    },
    col: function(columnName){
        return ['col', columnName];
    }
};

test('find', function(t){

    t.plan(1);

    var result = parseFn(fakePrequelize, 'foo', 'count(col("id"))');

    t.deepEqual(result, ['count', ['col', 'id']]);
});
