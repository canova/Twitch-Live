var settings  = require("../lib/settings"),
    ss = require('sdk/simple-storage');

exports["test settings prepare"] = function(assert) {
    // Deleting settings storage incase of another test has run
    ss.storage.settings = null;

    // Calling prepare function
    settings.prepare('install');

    // Comparing if prepare function set this settings properly
    assert.equal(ss.storage.settings['notification'], true);
    assert.equal(ss.storage.settings['notifySound'], true);
    assert.equal(ss.storage.settings['open'], 1);
    assert.equal(ss.storage.settings['notifySoundRing'], 'Chord.mp3');
};

exports["test settings setStorageItem"] = function(assert) {
    if (!ss.storage.settings) {
        ss.storage.settings = {};
    }
    
    settings.setStorageItem('setItem1', 'setValue1');
    settings.setStorageItem('setItem2', 'setValue2');

    assert.equal(ss.storage.settings['setItem1'], 'setValue1');
    assert.equal(ss.storage.settings['setItem2'], 'setValue2');
};

exports["test settings getStorageItem"] = function(assert) {
    if (!ss.storage.settings) {
        ss.storage.settings = {};
    }
    
    ss.storage.settings['getItem1'] = 'getValue1';
    ss.storage.settings['getItem2'] = 'getValue2';

    assert.equal(settings.getStorageItem('getItem1'), 'getValue1');
    assert.equal(settings.getStorageItem('getItem2'), 'getValue2');
    assert.ok(settings.getStorageItem('getItemNotExist') === undefined);
};

exports["test settings deleteStorageItem"] = function(assert) {
    if (!ss.storage.settings) {
        ss.storage.settings = {};
    }

    ss.storage.settings['deletingItem'] = 'test';
    settings.deleteStorageItem('deletingItem');
    assert.ok(ss.storage.settings['deletingItem'] === undefined);
};

require("sdk/test").run(exports);
