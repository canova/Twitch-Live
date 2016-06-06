// Firefox Add-on Requires
var self = require('sdk/self'),
    buttons = require('sdk/ui/button/action'),
    panels = require('sdk/panel'),
    Request = require('sdk/request').Request,
    tmr = require('sdk/timers'),
    notifications = require('sdk/notifications'),
    tabs = require('sdk/tabs'),
    _ = require('sdk/l10n').get,
    ss = require('sdk/simple-storage'),
    platform = require("sdk/system").platform;

// API Urls
var streamAPI = 'https://api.twitch.tv/kraken/streams/',
    gameAPI = 'https://api.twitch.tv/kraken/games/top',
    followingAPI = 'https://api.twitch.tv/kraken/users/{0}/follows/channels',
    featuredAPI = 'https://api.twitch.tv/kraken/streams/featured',
    searchAPI = 'https://api.twitch.tv/kraken/search/streams';

var isFirst = true,
    followingNames = [],
    liveFollowings = [],
    newLiveFollowings = [],
    intervalID = null;

// Creating an empty settings locale storage if it is not set yet.
if (!ss.storage.settings)
    ss.storage.settings = {};

// Executes after extension loads.
exports.main = function(options, callbacks) {

    // Setting first settings
    if ((options.loadReason == "install" || options.loadReason == "upgrade") && Object.keys(ss.storage.settings).length == 0) {
        setStorageItem('notification', true);
        setStorageItem('notifySound', true);
        setStorageItem('open', 1);
        setStorageItem('notifySoundRing', 'Chord.mp3');
    }

    // Localization variables
    var viewers = ' ' + _('viewers'),
        channels = ' ' + _('channels'),
        playing = _('playing'),
        signIn = _('sign_in'),
        signOut = _('sign_out'),
        noStreams = _('no_streams'),
        searchMessage = _('search_message');



    // Action Button Initialize
    var button = buttons.ActionButton({
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
    var panel = panels.Panel({
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

    function include(arr, obj) {
        return (arr.indexOf(obj) != -1);
    }

    /* String format function */
    function strFormat() {
        var s = arguments[0];
      for (var i = 0; i < arguments.length - 1; i++) {       
          var reg = new RegExp("\\{" + i + "\\}", "gm");             
          s = s.replace(reg, arguments[i + 1]);
      }
      return s;
    }

    /**
     * Port to get online following channels.
     * Send all followed channels to printFollowing() function for API request.
     */
    panel.port.on('getFollowings', function() {
        isFirst = true;

        if (followingNames.length > 0) {
            for (var i = 0; i < followingNames.length; i++) {
                if (i == followingNames.length - 1) {
                    printFollowing(followingNames[i], true);
                } else {
                    printFollowing(followingNames[i]);
                }
            }
        } else {
            panel.port.emit('noFollowingStream', noStreams);
        }
    });

    /**
     * Get followed channels one by one and send a API request.
     * If channels if online return port for channel information.
     */
    function printFollowing(name, isLast) {
        Request ({
            url: streamAPI + encodeURIComponent(name),
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                if (response.json.stream != null) {
                    if (isFirst === true) {
                        isFirst = false;
                    }
                    panel.port.emit('followResponse', response.json, viewers, playing);
                }

                // If there is no online channel, then it give a warning
                if (isFirst == true && isLast == true) {
                    panel.port.emit('noFollowingStream', noStreams);
                }
            }
        }).get();
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
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('gameResponse', response.json, viewers, channels);
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
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('streamResponse', response.json, viewers, playing);
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
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('streamByGameResponse', response.json, viewers, playing);
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
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('featuredResponse', response.json, viewers, playing);
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
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit('searchResponse', response.json, viewers, playing);
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
        var username = getStorageItem('twitchName');
        var notifyStatus = getStorageItem('notification');

        if (username != undefined && username != '' && notifyStatus == true) {
            followingCheck(username, function() {
                // Firstly we are initializing a postnotify and then
                // setting it to do that for 5mins(300000 ms) repeatedly.
                postNotify();
                intervalID = tmr.setInterval(postNotify, 300000); // 5 * 60 * 100
            });
        }
    }

    /**
     * Send API request to get all followers.
     * Used in initialize port and for refresh the followers.
     */
    function followingCheck(username, callback) {
        if (username != undefined) {
            var followUrl = strFormat(followingAPI, encodeURIComponent(username));

            Request ({
                url: followUrl,
                content: {
                    limit: 500
                },
                headers: {
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
        var a = 0;
        var index = 0;
        var streamersText = '';
        var isLiveEmpty = liveFollowings.length == 0;
        var lastUrl = '';

        if (followingNames.length > 0) {
            for (var i = 0; i < followingNames.length; i++) {
                Request ({
                    url: streamAPI + encodeURIComponent(followingNames[i]),
                    headers: {
                        'Cache-control': 'no-cache'
                    },
                    onComplete: function(response) {

                        // If live followigs empty, then here executes, otherwise goes to else for comparison
                        if (isLiveEmpty) {
                            if (response.json.stream != undefined) {
                                if (response.json.stream.channel.display_name !== undefined) {
                                    liveFollowings[a++] = response.json.stream.channel.display_name;
                                    lastUrl = response.json.stream.channel.url;
                                }
                            }

                            index++;
                            if (index == followingNames.length) {
                                streamersText = liveFollowings.join(', ');
                                streamersText += ' ' + _('now_online');

                                notify(streamersText, a, false, lastUrl);
                            }

                        } else {
                            if (response.json.stream != undefined) {
                                if (response.json.stream.channel.display_name !== undefined) {
                                    newLiveFollowings[a++] = response.json.stream.channel.display_name;
                                    if (!include(liveFollowings, response.json.stream.channel.display_name))
                                        lastUrl = response.json.stream.channel.url;
                                }
                            }

                            index++;
                            if (index == followingNames.length) {
                                var nowOnlineCount = 0;

                                for (var j = 0; j < newLiveFollowings.length; j++) {
                                    if (!include(liveFollowings, newLiveFollowings[j])) {
                                        streamersText += newLiveFollowings[j] + ', ';
                                        nowOnlineCount++;
                                    }
                                }

                                if (nowOnlineCount != 0) {
                                    streamersText = streamersText.slice(0, -2); // to delete the last ', ' characters.
                                    streamersText += ' ' + _('now_online');
                                    notify(streamersText, nowOnlineCount, true, lastUrl);
                                }
                            }
                        }

                    }
                }).get();
            }
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
                    openLink('http://www.twitch.tv/directory/following', false);
                }
            });
        }

        // Play audio if OS is Windows and we have actual channels gone live, if count < 1 this method causes no notification yet sound would still play
        if (platform == 'winnt' && getStorageItem('notifySound') == true && count >= 1) {
		panel.port.emit('playSound', getStorageItem('notifySoundRing'));
        }

        // If newlivefollowings is not empty, pass it's content to main array and empty it.
        if (newLive) {
            liveFollowings = [];
            liveFollowings = newLiveFollowings;
            newLiveFollowings = [];
        };
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

        if (getStorageItem('twitchName') == undefined) {
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
            notification: getStorageItem('notification'),
            notifySound: getStorageItem('notifySound'),
            open: getStorageItem('open'),
            notifySoundRing: getStorageItem('notifySoundRing'),
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
        setStorageItem(setting, value);

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
        followingCheck(getStorageItem('twitchName'));
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
        var openType = getStorageItem('open');

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
        setStorageItem(key, value);
    });

    // Get Simple Storage Item
    panel.port.on('getStorage', function(key) {
        panel.port.emit('getStorageResponse', getStorageItem(key));
    });

    // Delete Simple Storage Item
    panel.port.on('deleteStorage', function(key) {
        deleteStorageItem(key)
    });
};

exports.dummy = function() {
    var x = 10 + 15;
}
