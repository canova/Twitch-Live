// Firefox Add-on Requires
var self = require('sdk/self'),
    ActionButton = require('sdk/ui/button/action').ActionButton,
    _ = require('sdk/l10n').get,
    settings = require('./settings'),
    requests = require('./requests'),
    notification = require('./notification');

// API Urls
const APIRoot = 'https://api.twitch.tv/kraken/';

exports.apiUrls = {
    stream: APIRoot + 'streams/',
    game: APIRoot + 'games/top',
    following: APIRoot +  'users/{0}/follows/channels',
    featured: APIRoot + 'streams/featured',
    search: APIRoot + 'search/streams'
};

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
     * Get followed channels one by one and send a API request.
     * If channels if online return port for channel information.
     */
    function printFollowing() {
        requests.getOnlineFollowers(notification.followingNames, function(response) {
            if (response.json.streams.length > 0) {
                panel.port.emit('followResponse', response.json.streams, viewers, playing);
            } else {
                panel.port.emit('noFollowingStream', noStreams);
            }
        });
    }

    /**
     * Port to get online following channels.
     * Send all followed channels to printFollowing() function for API request.
     */
    panel.port.on('getFollowings', function() {
        if (notification.followingNames.length > 0) {
            printFollowing();
        } else {
            panel.port.emit('noFollowingStream', noStreams);
        }
    });

    /**
     * Port to get top 50 games.
     * Return a port for game informations.
     */
    panel.port.on('printGames', function() {
        requests.getGames(function(response) {
            panel.port.emit('gameResponse', response.json.top, viewers, channels);
        });
    });

    /**
     * Port to get top 50 streams by popularity.
     * Return a port for stream informations.
     */
    panel.port.on('printStreams', function() {
        requests.getStreams(function(response) {
            panel.port.emit('streamResponse', response.json.streams, viewers, playing);
        });
    });

    /**
     * Port to get top 50 streams by game. This port is used for second page of the game tab.
     * Return a port for stream informations.
     */
    panel.port.on('getStreamsByGame', function(gameName) {
        requests.getStreamsByGame(gameName, function(response) {
            panel.port.emit('streamByGameResponse', response.json.streams, viewers, playing);
        });
    });

    /**
     * Port to get top 50 featured streams.
     * Return a port for stream informations.
     */
    panel.port.on('getFeatured', function() {
        requests.getFeatured(function(response) {
            panel.port.emit('featuredResponse', response.json.featured, viewers, playing);
        });
    });

    /**
     * Port to get search result by query.
     * Return a port for search result
     */
    panel.port.on('search', function(query) {
        requests.getSearchResponse(query, function(response) {
            panel.port.emit('searchResponse', response.json.streams, viewers, playing, notFound);
        });
    });

    /**
     * Call initializeNotify() for initialize notifications.
     */
    panel.port.on('initialize', function() {
        notification.initialize();
    });

    /**
     * Port to call clearTimer function for clear timer.
     */
    panel.port.on('clearTimer', function() {
        notification.clearTimer();
    });

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
                notification.initialize();
            } else {
                notification.clearTimer();
            }
        }
    });

    /**
     * Port for refresh followings.
     */
    panel.port.on('refreshFollowings', function() {
        notification.followingCheck(settings.getStorageItem('twitchName'));
    });

    /**
     * Port for Open Url and hide the panel.
     */
    panel.port.on('openPage', function(url) {
        notification.openLink(url, true);
    });

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
        settings.deleteStorageItem(key);
    });
};
