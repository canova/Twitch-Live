var tmr = require('sdk/timers'),
    notifications = require('sdk/notifications'),
    tabs = require('sdk/tabs'),
    _ = require('sdk/l10n').get,
    platform = require("sdk/system").platform,
    settings = require('./settings'),
    requests = require('./requests'),
    helpers = require('./helpers');

var followingNames = [],
    liveFollowings = [],
    newLiveFollowings = [],
    intervalID = null;

/**
 * Get followers and initialize notifications.
 * Notifications send in every 5 minutes.
 */
function initialize() {
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
        requests.getAllFollowers(username, function(response) {
            if (response.json.follows != undefined) {
                for (var i = 0; i < response.json.follows.length; i++) {
                    followingNames[i] = response.json.follows[i].channel.name;
                }

                // If callback parameter is filled, execute it.
                if (helpers.checkCallback(callback)) {
                    callback();
                }
            }
        });
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
        requests.getOnlineFollowers(followingNames, function(response) {
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

    // Play audio if OS is Windows and we have actual channels gone live,
    // if count < 1 this method causes no notification yet sound would still play
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
 * Clear timer and empty the follower lists.
 */
function clearTimer() {
    tmr.clearInterval(intervalID);
    liveFollowings = [];
    newLiveFollowings = [];
}

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

exports.initialize = initialize;
exports.followingCheck = followingCheck;
exports.clearTimer = clearTimer;
exports.openLink = openLink;

exports.followingNames = followingNames;

