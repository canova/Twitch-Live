// Firefox Add-on Requires
var self = require('sdk/self'),
    ActionButton = require('sdk/ui/button/action').ActionButton,
    Request = require('sdk/request').Request,
    tmr = require('sdk/timers'),
    notifications = require('sdk/notifications'),
    tabs = require('sdk/tabs'),
    _ = require('sdk/l10n').get,
    platform = require("sdk/system").platform,
    CLIENT_ID = require('sdk/simple-prefs').prefs['clientID'],
    settings = require('./settings'),
    helpers = require('./helpers');

// API Urls
var APIRoot = 'https://api.twitch.tv/kraken/',
    streamAPI = APIRoot + 'streams/',
    gameAPI = APIRoot + 'games/top',
    followingAPI = APIRoot +  'users/{0}/follows/channels',
    featuredAPI = APIRoot + 'streams/featured',
    searchAPI = APIRoot + 'search/streams';

var isFirst = true,
    followingNames = [],
    liveFollowings = [],
    newLiveFollowings = [],
    intervalID = null;

// Executes after extension loads.
exports.main = function(options, callbacks) {
    // Preparing simple storage settings if not exist
    settings.prepare(options.loadReason);

    // Localization variables
    var viewers = ' ' + _('viewers'),
        channels = ' ' + _('channels'),
        playing = _('playing'),
        signIn = _('sign_in'),
        signOut = _('sign_out'),
        noStreams = _('no_streams'),
        searchMessage = _('search_message'),
        notFound = _('not_found');

    // Action Button Initialize
    var button = ActionButton({
        id: 'twitch-live',
        label: 'Twitch Live',
        icon: {
            '16': './icons/twitch-icon-32.png',
            '32': './icons/twitch-icon-32.png',
            '64': './icons/twitch-icon-64.png',
            '128': './icons/twitch-icon-128.png'
        },
        onClick: handleClick
    });

    // Panel Initialize
    var panel = require('sdk/panel').Panel({
        contentURL: self.data.url('panel.html'),
        width: 400,
        height: 555
    });

    // Action Button Click Handler
    function handleClick(state) {
        panel.show({
            position: button
        });
    }

    /**
     * Port to get online following channels.
     * Send all followed channels to printFollowing() function for API request.
     */
    panel.port.on('getFollowings', function() {
        if (followingNames.length > 0) {
            printFollowing();
        } else {
            panel.port.emit('noFollowingStream', noStreams);
        }
    });

    /**
     * Get followed channels json as response and call the given callback.
     * Using by Following page and notification.
     */
    function followingRequest(callback) {
        var followingNamesList = followingNames.join(',');

        Request ({
            url: streamAPI,
            headers: {
                'Client-ID': CLIENT_ID,
                'Cache-control': 'no-cache'
            },
            content: {
                'channel': encodeURIComponent(followingNamesList),
                'limit': followingNames.length
            },
            onComplete: function(response) {
                if (callback && typeof(callback) === 'function') {
                    callback(response);
                }
            }
        }).get();
    }

    /**
     * Get followed channels one by one and send a API request.
     * If channels if online return port for channel information.
     */
    function printFollowing() {
        followingRequest(function(response) {
            if (response.json.streams.length > 0) {
                panel.port.emit('followResponse', response.json.streams, viewers, playing);
            } else {
                panel.port.emit('noFollowingStream', noStreams);
            }
        });
    }

    /**
     * Port to get top 50 games.
     * Return a port for game informations.
     */
    panel.port.on('printGames', function() {
        Request ({
            url: gameAPI,
            content: {
                limit: 50
            },
            headers: {
                'Client-ID': CLIENT_ID,
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('gameResponse', response.json.top, viewers, channels);
            }
        }).get();
    });

    /**
     * Port to get top 50 streams by popularity.
     * Return a port for stream informations.
     */
    panel.port.on('printStreams', function() {
        Request ({
            url: streamAPI,
            content: {
                limit: 50
            },
            headers: {
                'Client-ID': CLIENT_ID,
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('streamResponse', response.json.streams, viewers, playing);
            }
        }).get();
    });

    /**
     * Port to get top 50 streams by game. This port is used for second page of the game tab.
     * Return a port for stream informations.
     */
    panel.port.on('getStreamsByGame', function(gameName) {
        Request ({
            url: streamAPI,
            content: {
                game : gameName,
                limit : 50
            },
            headers: {
                'Client-ID': CLIENT_ID,
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('streamByGameResponse', response.json.streams, viewers, playing);
            }
        }).get();
    });

    /**
     * Port to get top 50 featured streams.
     * Return a port for stream informations.
     */
    panel.port.on('getFeatured', function() {
        Request ({
            url: featuredAPI,
            content: {
                limit: 50
            },
            headers: {
                'Client-ID': CLIENT_ID,
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('featuredResponse', response.json.featured, viewers, playing);
            }
        }).get();
    });

    /**
     * Port to get search result by query.
     * Return a port for search result
     */
    panel.port.on('search', function(query) {
        Request ({
            url: searchAPI,
            content: {
                q: encodeURIComponent(query)
            },
            headers: {
                'Client-ID': CLIENT_ID,
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('searchResponse', response.json.streams, viewers, playing, notFound);
            }
        }).get();
    });

    /**
     * Call initializeNotify() for initialize notifications.
     */
    panel.port.on('initialize', function() {
        initializeNotify();
    });


    /**
     * Get followers and initialize notifications.
     * Notifications send in every 5 minutes.
     */
    function initializeNotify() {
        var username = settings.getStorageItem('twitchName');

        if (username != undefined && username != '') {
            followingCheck(username, function() {
                // Firstly we are initializing a postnotify and then
                // setting it to do that for 5mins(300000 ms) repeatedly.
                if(settings.getStorageItem('notification') == true) {
                    postNotify();
                    intervalID = tmr.setInterval(postNotify, 300000); // 5 * 60 * 100
                }
            });
        }
    }

    /**
     * Send API request to get all followers.
     * Used in initialize port and for refresh the followers.
     */
    function followingCheck(username, callback) {
        if (username != undefined) {
            var followUrl = helpers.strFormat(followingAPI, encodeURIComponent(username));

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
                    if (response.json.follows != undefined) {
                        for (var i = 0; i < response.json.follows.length; i++) {
                            followingNames[i] = response.json.follows[i].channel.name;
                        }

                        // If callback parameter is filled, execute it.
                        if (callback && typeof(callback) === 'function') {
                            callback();
                        }
                    }
                }
            }).get();
        };
    }

    /**
     * Execute in every 5 minutes and check for the new online streamers.
     * If there is online streamer then send it to notify function to show notify.
     */
    function postNotify() {
        var streamersText = '';
        var isLiveFollowingsEmpty = liveFollowings.length == 0;
        var streamUrl = '';

        if (followingNames.length > 0) {
            followingRequest(function(response) {
                var streams = response.json.streams;
                var streamsLength = streams.length;

                // Checking if there is online stream in followed channels.
                if(streamsLength > 0) {
                    // If it is first notification then go to here.
                    if (isLiveFollowingsEmpty) {
                        for(var i = 0; i < streamsLength; i++) {
                            if (streams[i].channel.display_name !== undefined) {
                                liveFollowings.push(streams[i].channel.display_name);
                            }
                        }

                        // Setting stream url to notification url if just one channel go online
                        if(streamsLength == 1) {
                            streamUrl = streams[0].channel.url;
                        }

                        streamersText = liveFollowings.join(', ') + ' ' + _('now_online');
                        notify(streamersText, streamsLength, false, streamUrl);
                    } else {
                        // If this is not the first notification then go to here.
                        var newUniqueStreams = [];
                        for(var i = 0; i < streamsLength; i++) {
                            if (streams[i].channel.display_name !== undefined) {
                                newLiveFollowings.push(streams[i].channel.display_name);

                                // Checking if the streamer is not online in previous notification.
                                if (!helpers.include(liveFollowings, streams[i].channel.display_name)) {
                                    newUniqueStreams.push(streams[i].channel.display_name);
                                    streamUrl = streams[i].channel.url;
                                }
                            }
                        }

                        streamersText = newUniqueStreams.join(', ') + ' ' + _('now_online');
                        notify(streamersText, newUniqueStreams.length, true, streamUrl);
                    }
                }
            });
        }

    }

    /**
     * Get notify text count and show notification with these.
     * If there is one online streamer then show different
     */
    function notify(ntext, count, newLive, lastUrl) {
        if (count == 1) {
            notifications.notify({
                title: ntext,
                text: _('click_to_go'),
                iconURL: './icons/twitch-icon-128.png',
                onClick: function() {
                    openLink(lastUrl, true);
                }
            });
        } else if (count > 1) {
            notifications.notify({
                title: count + ' ' + _('streamers_online'),
                text: ntext,
                iconURL: './icons/twitch-icon-128.png',
                onClick: function() {
                    openLink('https://www.twitch.tv/directory/following', false);
                }
            });
        }

        // Play audio if OS is Windows and we have actual channels gone live, if count < 1 this method causes no notification yet sound would still play
        if (platform == 'winnt' && settings.getStorageItem('notifySound') == true && count >= 1) {
            panel.port.emit('playSound', settings.getStorageItem('notifySoundRing'));
        }

        // If newlivefollowings is not empty, pass it's content to main array and empty it.
        if (newLive) {
            liveFollowings = [];
            liveFollowings = newLiveFollowings;
            newLiveFollowings = [];
        }
    }

    /**
     * Port to call clearTimer function for clear timer.
     */
    panel.port.on('clearTimer', function() {
        clearTimer();
    });

    /**
     * Clear timer and empty the follower lists.
     */
    function clearTimer() {
        tmr.clearInterval(intervalID);
        liveFollowings = [];
        newLiveFollowings = [];
    }

    /**
     * Port for login page localization.
     */
    panel.port.on('loginPage', function() {
        var locale = { 
            signIn: signIn, 
            passSign: _('pass_sign'), 
            welcomeMsg: _('welcome_msg'), 
            username: _('username') 
        };

        panel.port.emit('loginPageResponse', locale);
    });

    /**
     * Port for sign in/out localization.
     */
    panel.port.on('getSignInOut', function() {
        if (settings.getStorageItem('twitchName') == undefined) {
            panel.port.emit('getSignInOutResponse', signIn);
        } else {
            panel.port.emit('getSignInOutResponse', signOut);
        }
    });

    /**
     * Port for sign out localization.
     */
    panel.port.on('getLoadCheck', function() {
        panel.port.emit('getLoadCheckResponse', signOut);
    });

    /**
     * Port for search page beginning message localization.
     */
    panel.port.on('searchMessage', function() {
        panel.port.emit('searchMessageResponse', searchMessage);
    });

    /**
     * Port for setting localizations and values.
     */
    panel.port.on('getSettings', function(isLogged) {
        var settingsLocale = {
            refreshBtn: _('refresh_fl_btn'),
            refreshMsg: _('refresh_followed'),
            help: _('donate'),
            createdBy: _('created_by'),
            notification: settings.getStorageItem('notification'),
            notifySound: settings.getStorageItem('notifySound'),
            open: settings.getStorageItem('open'),
            notifySoundRing: settings.getStorageItem('notifySoundRing'),
            showNotifications: _('show_notifications'),
            playSound: _('play_sound'),
            openStreams: _('open_streams'),
            newTab: _('new_tab'),
            newWindow: _('new_window'),
            popout: _('popout'),
            notificationSound: _('new_tab'),
            newTab: _('new_tab'),
            notificationSound: _('notification_sound')
        };

        if (isLogged) {
            settingsLocale.logMsg = _('logged_as');
            settingsLocale.logInOut = signOut;
            panel.port.emit('settingsResponse', settingsLocale);
        } else {
            settingsLocale.logMsg = _('not_logged_yet');
            settingsLocale.logInOut = signIn;
            panel.port.emit('settingsResponse', settingsLocale);
        }
    });

    panel.port.on('changeSetting', function (setting, value) {
        settings.setStorageItem(setting, value);

        if (setting == 'notification') {
            if (value == true) {
                initializeNotify();
            } else {
                clearTimer();
            }
        }
    });

    /**
     * Port for refresh followings.
     */
    panel.port.on('refreshFollowings', function() {
        followingCheck(settings.getStorageItem('twitchName'));
    });

    /**
     * Port for Open Url and hide the panel.
     */
    panel.port.on('openPage', function(url) {
        openLink(url, true)
    });

    /**
     * Open Link depend on which open type selected in settings.
     */
    function openLink(url, isStream) {
        var openType = settings.getStorageItem('open');

        if (openType == 2) {
            tabs.open({
              url: url,
              inNewWindow: true
            });
        } else if (openType == 3 && isStream) {
            url = url + '/popout';
            tabs.open(url);
        } else {
            tabs.open(url);
        }

        panel.hide();
    }

    // Set Simple Storage Item
    panel.port.on('setStorage', function(key, value) {
        settings.setStorageItem(key, value);
    });

    // Get Simple Storage Item
    panel.port.on('getStorage', function(key) {
        panel.port.emit('getStorageResponse', settings.getStorageItem(key));
    });

    // Delete Simple Storage Item
    panel.port.on('deleteStorage', function(key) {
        settings.deleteStorageItem(key)
    });
};
