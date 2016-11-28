var Request = require('sdk/request').Request,
    CLIENT_ID = require('sdk/simple-prefs').prefs['clientID'],
    main = require('./main'),
    helpers = require('./helpers');

/**
 * Get top 50 games as response and call the given callback.
 * Using by printStreams port.
 */
function getGames(callback) {
    Request({
        url: main.apiUrls.game,
        content: {
            limit: 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache',
            'Accept': 'application/vnd.twitchtv.v3+json'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

/**
 * Get top 50 streams as response and call the given callback.
 * Using by printStreams port.
 */
function getStreams(callback) {
    Request({
        url: main.apiUrls.stream,
        content: {
            limit: 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache',
            'Accept': 'application/vnd.twitchtv.v3+json'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

/**
 * Send game name and get streams by given name as response and call the given callback.
 * Using by getStreamsByGame port.
 */
function getStreamsByGame(gameName, callback) {
    Request({
        url: main.apiUrls.stream,
        content: {
            game : gameName,
            limit : 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache',
            'Accept': 'application/vnd.twitchtv.v3+json'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

/**
 * Get featured channels as response and call the given callback.
 * Using by getFeatured port.
 */
function getFeatured(callback) {
    Request({
        url: main.apiUrls.featured,
        content: {
            limit: 50
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache',
            'Accept': 'application/vnd.twitchtv.v3+json'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

/**
 * Send query and get search result as response and call the given callback.
 * Using by search port.
 */
function getSearchResponse(query, callback) {
    Request({
        url: main.apiUrls.search,
        content: {
            q: encodeURIComponent(query)
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache',
            'Accept': 'application/vnd.twitchtv.v3+json'
        },
        onComplete: function(response) {
            if (callback && typeof(callback) === 'function') {
                callback(response);
            }
        }
    }).get();
}

/**
 * Get all followed channels as response and call the given callback.
 * Using by followingCheck function.
 */
function getAllFollowers(username, callback) {
    var followUrl = helpers.strFormat(main.apiUrls.following, encodeURIComponent(username));

    Request({
        url: followUrl,
        content: {
            limit: 500
        },
        headers: {
            'Client-ID': CLIENT_ID,
            'Cache-control': 'no-cache',
            'Accept': 'application/vnd.twitchtv.v3+json'
        },
        onComplete: function(response) {
            if (helpers.checkCallback(callback)) {
                callback(response);
            }
        }
    }).get();
}

/**
 * Get online followed channels json as response and call the given callback.
 * Using by Following page and notification.
 */
function getOnlineFollowers(followingNames, callback) {
    var followingNamesList = helpers.chunk(followingNames, 100);
    var subLength = followingNamesList.length;
    var streams = [];
    var responseCount = 0;

    for (var i = 0; i < subLength; i++) {
        Request({
            url: main.apiUrls.stream,
            headers: {
                'Client-ID': CLIENT_ID,
                'Cache-control': 'no-cache',
                'Accept': 'application/vnd.twitchtv.v3+json'
            },
            content: {
                'channel': followingNamesList[i].join(','),
                'limit': followingNamesList[i].length
            },
            onComplete: function(response) {
                streams = streams.concat(response.json.streams);
                if (++responseCount == subLength) {
                    if (helpers.checkCallback(callback)) {
                        callback(streams);
                    }
                }
            }
        }).get();
    }
}

exports.getOnlineFollowers = getOnlineFollowers;
exports.getGames = getGames;
exports.getStreams = getStreams;
exports.getStreamsByGame = getStreamsByGame;
exports.getFeatured = getFeatured;
exports.getSearchResponse = getSearchResponse;
exports.getAllFollowers = getAllFollowers;
