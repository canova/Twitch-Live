var helpers = require("../lib/helpers");

exports['test helpers include'] = function(assert) {
    var obj = {hello : 'world'};
    var array = ['test', 'unit testing', 10, obj];

    // These are not exist and should return false
    assert.ok(helpers.include(array,'unit') == false);
    assert.ok(helpers.include(array,'unit test') == false);
    assert.ok(helpers.include(array, 'hello world') == false);
    assert.ok(helpers.include(array, 'Test') == false);
    assert.ok(helpers.include(array, 'test!') == false);
    assert.ok(helpers.include(array, '10') == false);

    // These are exist and should return true
    assert.ok(helpers.include(array, 'test') == true);
    assert.ok(helpers.include(array, 'unit testing') == true);
    assert.ok(helpers.include(array, 10) == true);
    assert.ok(helpers.include(array, obj) == true);
};

exports['test helpers strFormat'] = function(assert) {
    var str1 = 'hello {0}! How are you {1}?';
    var transformedStr1 = helpers.strFormat(str1, 'twitch', 'today');

    assert.equal(transformedStr1, 'hello twitch! How are you today?');

    var str2 = '{0}, {1}, {2}, {0}, {1}, {2}';
    var transformedStr2 = helpers.strFormat(str2, '1', '2', 3);
    assert.equal(transformedStr2, '1, 2, 3, 1, 2, 3');
    
    var str3 = '{0}, {1}';
    var transformedStr3 = helpers.strFormat(str3, 1, 2);
    assert.equal(transformedStr3, '1, 2');

};

require("sdk/test").run(exports);
