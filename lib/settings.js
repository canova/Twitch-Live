var ss = require('sdk/simple-storage');

// Creating an empty settings locale storage if it is not set yet.
exports.prepare = function(loadReason) {
    if (!ss.storage.settings) {
        ss.storage.settings = {};
    }

    // Setting first settings if not set before
    if ((loadReason == 'install' || loadReason == 'upgrade') && Object.keys(ss.storage.settings).length == 0) {
        exports.setStorageItem('notification', true);
        exports.setStorageItem('notifySound', true);
        exports.setStorageItem('open', 1);
        exports.setStorageItem('notifySoundRing', 'Chord.mp3');
    }
}

/* Storage helpers */
exports.getStorageItem = function(item) {
    return ss.storage.settings[item];
}

exports.setStorageItem = function(item, val) {
    ss.storage.settings[item] = val;
}

exports.deleteStorageItem = function(item) {
    delete ss.storage.settings[item];
}
