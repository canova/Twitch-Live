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


// Create the controller and inject Angular's $scope
twitchLive.controller('mainController', function($scope, $location) {
    var firstPort = true; // getLoadCheckResponse port returns 2 times this is for just one execution.
    getUserName(function(username) { gUsername = username; });
    addon.port.emit('getLoadCheck');

    addon.port.on('getLoadCheckResponse', function(signOut) {
        if (firstPort) {
            var firstTime = localStorage.getItem('twitchLiveFirst');

            if ((firstTime == undefined || firstTime == true) && gUsername == undefined) { // I did 'firstTime == true' just in case of new update or smth.
                localStorage.setItem('twitchLiveFirst', false);
                $location.url('/login');
                $scope.$apply();
            } else {
                angular.element(document.getElementById('loginOut')).html(signOut);
                $location.url('/games');
                addon.port.emit('initialize');
                $scope.$apply();
            }

            firstPort = false;
            $scope.$digest();
        }
    });
});

// Create the controller and inject Angular's $scope
twitchLive.controller('gamesController', function($scope, $location) {
    $scope.loading = true;

    //Send port for api call to main.js
    addon.port.emit('printGames');

    //Response from main.js
    addon.port.on('gameResponse', function(gameResult, gViewers, gChannels) {
        document.getElementById('refresh').alt = 'Refresh Game';

        $scope.list = gameResult.top;
        $scope.viewersText = gViewers;
        $scope.channelsText = gChannels;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.streamByGame = function(gameName) {
        $location.url('/streamByGame/' + gameName);
    }
});

// Create the controller and inject Angular's $scope
twitchLive.controller('streamByGameController', function($scope, $routeParams) {
    $scope.loading = true;
    //Send port for api call to main.js
    addon.port.emit('getStreamsByGame', $routeParams.gameName);

    //Response from main.js
    addon.port.on('streamByGameResponse', function(response, gViewers, gChannels) {
        document.getElementById('refresh').alt = 'Refresh Game';

        $scope.list = response.streams;
        $scope.viewersText = gViewers;
        $scope.channelsText = gChannels;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit('openPage', url);
    };
});

// Create the controller and inject Angular's $scope
twitchLive.controller('followingController', function($scope, $location) {
    if (gUsername != undefined) {
        addon.port.emit('getFollowings', gUsername);
        $scope.loading = true;
    } else {
        getUserName(function(username) { 
            if (username != undefined) {
                gUsername = username;
            } else {
                $location.url('/login');
                $scope.$apply();
            }
        });
    }

    document.getElementById('refresh').alt = 'Refresh Followings';
    //Creating an instance for push method
    $scope.list = [];

    // If there is online streams this port will work.
    addon.port.on('followResponse', function(response, gViewers, gPlaying) {
        $scope.list.push(response);
        $scope.viewersText = gViewers;
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
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

    //Send port for api call to main.js
    addon.port.emit('printStreams');

    //Response from main.js
    addon.port.on('streamResponse', function(response, gViewers, gPlaying) {
        document.getElementById('refresh').alt = 'Refresh Streams';

        $scope.list = response.streams;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit('openPage', url);
    };
});


// Create the controller and inject Angular's $scope
twitchLive.controller('featuredController', function($scope) {
    $scope.loading = true;

    //Send port for api call to main.js
    addon.port.emit('getFeatured');

    //Response from main.js
    addon.port.on('featuredResponse', function(response, gViewers, gPlaying) {
        document.getElementById('refresh').alt = 'Refresh Featured';

        $scope.list = response.featured;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit('openPage', url);
    };

});


// Create the controller and inject Angular's $scope
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

    addon.port.on('settingsResponse', function(logMsg, logInOut, refreshBtn, refreshMsg, help, createdBy, notification, notifySound, open, notifySoundRing) {
        getUserName(function(username) { gUsername = username; });

        if (gUsername == '' || gUsername == null || gUsername == undefined) {
            $scope.loggedIn = false;
        } else {
            $scope.loggedIn = true;
        }

        $scope.logMsg = logMsg;
        $scope.result = gUsername;
        $scope.logInOut = logInOut;
        $scope.refreshBtn = refreshBtn;
        $scope.refreshMsg = refreshMsg;
        $scope.help = help;
        $scope.createdBy = createdBy;
        $scope.notification = notification;
        $scope.notifySound = notifySound;
        $scope.open = open;
        $scope.notifySoundRing = notifySoundRing;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.loadLoginPage = function() {
        $location.url('/login');
    };

    $scope.logOut = function() {
        logOut();
    };

    $scope.refreshFollowings = function() {
        addon.port.on('refreshFollowings');
    };

    $scope.change = function(setting) {
        switch(setting) {
            case 'notification':
                addon.port.emit('changeSetting', 'notification', $scope.notification);
                break;
            case 'notifySound':
                addon.port.emit('changeSetting', 'notifySound', $scope.notifySound);
                break;
            case 'open': 
                addon.port.emit('changeSetting', 'open', $scope.open);
                break;
            case 'notifySoundRing': 
                addon.port.emit('changeSetting', 'notifySoundRing', $scope.notifySoundRing);
                break;
            default: 
                break;
        }
    };
});


// Create the controller and inject Angular's $scope
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

        // for scope life cycle
        $scope.$digest();
    });
});

// Create the controller and inject Angular's $scope
twitchLive.controller('loginController', function($scope, $location) {
    getUserName(function(username) { gUsername = username; })
    if (gUsername == null) {

        //Send port for login page strings
        addon.port.emit('loginPage');

        //Response from main.js
        addon.port.on('loginPageResponse', function(signIn, passSign, welcomeMsg) {

            $scope.signIn = signIn;
            $scope.passSign = passSign
            $scope.welcomeMsg = welcomeMsg;

            //for scope life cycle
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

// Create the controller and inject Angular's $scope
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

function getUserName(callback) {
    addon.port.emit('getStorage', 'twitchName');

    addon.port.on('getStorageResponse', function(username) {
        callback(username);
    });
}

function setUserName(twitchName) {
    try {
        addon.port.emit('setStorage', 'twitchName', twitchName);
        getUserName(function(username) { gUsername = username; });
        return true;
    } catch (ex) {
        return false;
    }
}

function deleteUserName() {
    try {
        addon.port.emit('deleteStorage', 'twitchName');
        gUsername = undefined;
        return true;
    } catch (ex) {
        return false;
    }
}

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

addon.port.on('playSound', function(soundName) {
    var audio = new Audio('./audio/' + soundName);
    audio.play();
});
