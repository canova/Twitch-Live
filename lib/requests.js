var Request = require('sdk/request').Request,
    CLIENT_ID = require('sdk/simple-prefs').prefs['clientID'],
    main = require('./main'),
    helpers = require('./helpers');

function getGames(callback) {
    Request ({
        url: main.apiUrls.game,
        content: {
            limit: 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

function getStreams(callback) {
    Request ({
        url: main.apiUrls.stream,
        content: {
            limit: 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

function getStreamsByGame(gameName, callback) {
    Request ({
        url: main.apiUrls.stream,
        content: {
            game : gameName,
            limit : 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

function getFeatured(callback) {
    Request ({
        url: main.apiUrls.featured,
        content: {
            limit: 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

function getSearchResponse(query, callback) {
    Request ({
        url: main.apiUrls.search,
        content: {
            q: encodeURIComponent(query)
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache'
        },
        onComplete: function(response) {
            if (callback && typeof(callback) === 'function') {
                callback(response);
            }
        }
    }).get();
}

function getAllFollowers(followUrl, callback) {
    Request ({
        url: followUrl,
        content: {
            limit: 500
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

/**
 * Get followed channels json as response and call the given callback.
 * Using by Following page and notification.
 */
function getOnlineFollowers(followingNames, callback) {
    var followingNamesList = followingNames.join(',');

    Request ({
        url: main.apiUrls.stream,
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache'
        },
        content: {
            'channel': encodeURIComponent(followingNamesList),
            'limit': followingNames.length
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

exports.getOnlineFollowers = getOnlineFollowers;
exports.getGames = getGames;
exports.getStreams = getStreams;
exports.getStreamsByGame = getStreamsByGame;
exports.getFeatured = getFeatured;
exports.getSearchResponse = getSearchResponse;
exports.getAllFollowers = getAllFollowers;
