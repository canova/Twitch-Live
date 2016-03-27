// Create the module and name it twitchLive, also include ngRoute for routing.
var twitchLive = angular.module('twitchLive', ['ngRoute']);
var gUsername;
var settings = [];

// Configure our routes
twitchLive.config(function($routeProvider) {
    $routeProvider
    // Route for the initial page
        .when('/', {
        templateUrl: 'templates/games.html',
        controller: 'mainController'
    })
    // Route for the games page
    .when('/games', {
        templateUrl: 'templates/games.html',
        controller: 'gamesController'
    })
    // Route for the streams by game page
    .when('/streamByGame/:gameName', {
        templateUrl: 'templates/streams.html',
        controller: 'streamByGameController'
    })
    // Route for the following page
    .when('/following', {
        templateUrl: 'templates/featured.html',
        controller: 'followingController'
    })
    // Route for the cannels page
    .when('/streams', {
        templateUrl: 'templates/streams.html',
        controller: 'streamsController'
    })
    // route for the featured page
    .when('/featured', {
        templateUrl: 'templates/featured.html',
        controller: 'featuredController'
    })
    // Route for the settings page
    .when('/settings', {
        templateUrl: 'templates/settings.html',
        controller: 'settingsController'
    })
    // Route for the search page
    .when('/search', {
        templateUrl: 'templates/search.html',
        controller: 'searchController'
    })
    // Route for the login page
    .when('/login', {
        templateUrl: 'templates/login.html',
        controller: 'loginController'
    })
    // Route for the other pages
    .otherwise({
        redirectTo: '/games'
    });
})


// Create the controller and inject Angular's $scope and $location
twitchLive.controller('mainController', function($scope, $location) {
    getUserName(function(username) { gUsername = username; });
    addon.port.emit('getLoadCheck');

    addon.port.on('getLoadCheckResponse', function loadCheckResponse(signOut) {
        addon.port.removeListener("getLoadCheckResponse", loadCheckResponse); // Removing for prevent from duplicate event listeners
        var firstTime = localStorage.getItem('twitchLiveFirst');

        if ((firstTime == undefined || firstTime == true) && gUsername == undefined) {
            localStorage.setItem('twitchLiveFirst', false);
            $location.url('/login');
            $scope.$apply();
        } else if (gUsername == undefined) {
            $location.url('/games');
            $scope.$apply();
        } else {
            angular.element(document.getElementById('loginOut')).html(signOut);
            $location.url('/games');
            addon.port.emit('initialize');
            $scope.$apply();
        }

        $scope.$digest();
    });
});

// Create the controller and inject Angular's $scope and $location
twitchLive.controller('gamesController', function($scope, $location) {
    $scope.loading = true;

    // Send port for api call to main.js
    addon.port.emit('printGames');

    // Response from main.js
    addon.port.on('gameResponse', function(gameResult, gViewers, gChannels) {
        document.getElementById('refresh').alt = 'Refresh Game';

        $scope.list = gameResult.top;
        $scope.viewersText = gViewers;
        $scope.channelsText = gChannels;
        $scope.loading = false;

        // For scope life cycle
        $scope.$digest();
    });

    $scope.streamByGame = function(gameName) {
        $location.url('/streamByGame/' + gameName);
    }
});

// Create the controller and inject Angular's $scope and $routeParams
twitchLive.controller('streamByGameController', function($scope, $routeParams) {
    $scope.loading = true;
    // Send port for api call to main.js
    addon.port.emit('getStreamsByGame', $routeParams.gameName);

    // Response from main.js
    addon.port.on('streamByGameResponse', function(response, gViewers, gChannels) {
        document.getElementById('refresh').alt = 'Refresh Game';

        $scope.list = response.streams;
        $scope.viewersText = gViewers;
        $scope.channelsText = gChannels;
        $scope.loading = false;

        // For scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit('openPage', url);
    };
});

// Create the controller and inject Angular's $scope, $location and $route
twitchLive.controller('followingController', function($scope, $location, $route) {
    if (gUsername != undefined) {
        addon.port.emit('getFollowings', gUsername);
        $scope.loading = true;
    } else {
        getUserName(function(username) {
            if (username != undefined) {
                gUsername = username;
                $route.reload();
            } else {
                $location.url('/login');
                $scope.$apply();
            }
        });
    }

    document.getElementById('refresh').alt = 'Refresh Followings';
    // Creating an instance for push method
    $scope.list = [];

    // If there is online streams this port will work.
    addon.port.on('followResponse', function(response, gViewers, gPlaying) {
        $scope.list.push(response);
        $scope.viewersText = gViewers;
        $scope.playingText = gPlaying;
        $scope.loading = false;

        // For scope life cycle
        $scope.$digest();

    });

    // If there is no following stream online, then this port will work.
    addon.port.on('noFollowingStream', function(noStreamText) {
        $scope.loading = false;
        $scope.noStream = true;
        $scope.noStreamText = noStreamText;

        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit('openPage', url);
    };
});

// Create the controller and inject Angular's $scope
twitchLive.controller('streamsController', function($scope) {
    $scope.loading = true;

    // Send port for api call to main.js
    addon.port.emit('printStreams');

    // Response from main.js
    addon.port.on('streamResponse', function(response, gViewers, gPlaying) {
        document.getElementById('refresh').alt = 'Refresh Streams';

        $scope.list = response.streams;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        // For scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit('openPage', url);
    };
});


// Create the controller and inject Angular's $scope
twitchLive.controller('featuredController', function($scope) {
    $scope.loading = true;

    // Send port for api call to main.js
    addon.port.emit('getFeatured');

    // Response from main.js
    addon.port.on('featuredResponse', function(response, gViewers, gPlaying) {
        document.getElementById('refresh').alt = 'Refresh Featured';

        $scope.list = response.featured;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        // For scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit('openPage', url);
    };

});


// Create the controller and inject Angular's $scope and $location
twitchLive.controller('settingsController', function($scope, $location) {
    if (gUsername == undefined) {
        getUserName(function(username) {
            gUsername = username;
        });
    }

    if (gUsername == '' || gUsername == null || gUsername == undefined) {
        addon.port.emit('getSettings', false);
    } else {
        addon.port.emit('getSettings', true);
    };

    addon.port.on('settingsResponse', function(locale) {
        getUserName(function(username) { gUsername = username; });

        if (gUsername == '' || gUsername == null || gUsername == undefined) {
            $scope.loggedIn = false;
        } else {
            $scope.loggedIn = true;
        }

        $scope.locale = locale;
        $scope.result = gUsername;

        // For scope life cycle
        $scope.$digest();
    });

    $scope.loadLoginPage = function() {
        $location.url('/login');
    };

    $scope.logOut = function() {
        logOut();
        $location.url('/');
    };

    $scope.refreshFollowings = function() {
        addon.port.on('refreshFollowings');
    };

    $scope.change = function(setting) {
        switch(setting) {
            case 'notification':
                addon.port.emit('changeSetting', 'notification', $scope.locale.notification);
                break;
            case 'notifySound':
                addon.port.emit('changeSetting', 'notifySound', $scope.locale.notifySound);
                break;
            case 'open':
                addon.port.emit('changeSetting', 'open', $scope.locale.open);
                break;
            case 'notifySoundRing':
                playSound($scope.locale.notifySoundRing);
                addon.port.emit('changeSetting', 'notifySoundRing', $scope.locale.notifySoundRing);
                break;
            default:
                break;
        }
    };
});

// Create the controller and inject Angular's $scope and $routeParams
twitchLive.controller('searchController', function($scope, $routeParams) {
    $scope.beginning = true;
    addon.port.emit('searchMessage');

    addon.port.on('searchMessageResponse', function(searchMessage) {
        $scope.beginningText = searchMessage;
        $scope.$digest();
    });

    // Wait for input query and send it as a search port
    $scope.$watch('query', debounce(function() {
        if ($scope.query != undefined && $scope.query != '') {
            $scope.loading = true;
            addon.port.emit('search', $scope.query);
        }
    }, 500));

    // Response port for search query
    addon.port.on('searchResponse', function(response, gViewers, gPlaying) {
        document.getElementById('refresh').alt = 'Refresh Search';
        $scope.beginning = false;

        $scope.list = response.streams;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        // For scope life cycle
        $scope.$digest();
    });
});

// Create the controller and inject Angular's $scope and $location
twitchLive.controller('loginController', function($scope, $location) {
    getUserName(function(username) { gUsername = username; });
    if (gUsername == null) {

        // Send port for login page strings
        addon.port.emit('loginPage');

        // Response from main.js
        addon.port.on('loginPageResponse', function(locale) {

            $scope.locale = locale;

            // For scope life cycle
            $scope.$digest();
        });

        // If posted, then set twitch username and redirect to game page.
        $scope.post = function() {
            setUserName($scope.username);
            $location.url('/');
        };
    } else {
        logOut();
        $location.url('/');
    }
});

// Create the controller and inject Angular's $scope and $location
twitchLive.controller('sidebarController', function($scope, $location) {
    // Function for sidebar actve classes.
    $scope.isActive = function(viewLocation) {
        return viewLocation === $location.path();
    };
});

// Delaying a function to load for api calls
function debounce(fn, delay) {
  var timer = null;

  return function () {
    var context = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

/**
 * Get username from simple storage and execute callback function.
 */
function getUserName(callback) {
    addon.port.emit('getStorage', 'twitchName');

    addon.port.on('getStorageResponse', function usernameResult(username) {
        addon.port.removeListener("getStorageResponse", usernameResult);

        // If callback parameter is filled, execute it. Callback function must be given but in case of something there is an if block.
        if (callback && typeof(callback) === 'function') {
            callback(username);
        }
    });

}

/**
 * Set username to simple storage
 */
function setUserName(twitchName) {
    try {
        addon.port.emit('setStorage', 'twitchName', twitchName);
        getUserName(function(username) { gUsername = username; });
        return true;
    } catch (ex) {
        return false;
    }
}

/**
 * Delete username from simple storage
 */
function deleteUserName() {
    try {
        addon.port.emit('deleteStorage', 'twitchName');
        gUsername = undefined;
        return true;
    } catch (ex) {
        return false;
    }
}

/**
 * Delete username, clear timer and emit a port for sign out.
 */
function logOut() {
    if (gUsername != undefined) {
        var result = deleteUserName();
        if (result) {
            addon.port.emit('clearTimer');

            addon.port.emit('getSignInOut');
            addon.port.on('getSignInOutResponse', function(signIn) {
                angular.element(document.getElementById('loginOut')).html(signIn);
            });

        };
    };
}

// Port for playing audio for notification in windows.
addon.port.on('playSound', function(soundName) {
    playSound(soundName);
});

/**
 * Play notification sound either in notification or settings page
 */
function playSound(soundName) {
    var audio = new Audio('./audio/' + soundName);
    audio.play();
}
