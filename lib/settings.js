var ss = require('sdk/simple-storage');

// Creating an empty settings locale storage if it is not set yet.
function prepare(loadReason) {
    if (!ss.storage.settings) {
        ss.storage.settings = {};
    }

    // Setting first settings if not set before
    if ((loadReason == 'install' || loadReason == 'upgrade') && Object.keys(ss.storage.settings).length == 0) {
        setStorageItem('notification', true);
        setStorageItem('notifySound', true);
        setStorageItem('open', 1);
        setStorageItem('notifySoundRing', 'Chord.mp3');
    }
}

/* Storage helpers */
function getStorageItem(item) {
    return ss.storage.settings[item];
}

function setStorageItem(item, val) {
    ss.storage.settings[item] = val;
}

function deleteStorageItem(item) {
    delete ss.storage.settings[item];
}

exports.prepare = prepare;
exports.getStorageItem = getStorageItem;
exports.setStorageItem = setStorageItem;
exports.deleteStorageItem = deleteStorageItem;
