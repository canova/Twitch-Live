// Create the module and name it twitchLive, also include ngRoute for routing.
var twitchLive = angular.module('twitchLive', ['ngRoute']);
//var response = [];


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


// create the controller and inject Angular's $scope
twitchLive.controller('mainController', function($scope, $location) {

    addon.port.emit("getLoadCheck");


    addon.port.on("getLoadCheckResponse", function(signOut) {

        var firstTime = localStorage.getItem("twitchLiveFirst");


        if ((firstTime == null || firstTime == true) && getUserName() == null) { // I did "firstTime == true" just in case of new update or smth.
            //localStorage.setItem("twitchLiveFirst", false);
            $location.url('/login');
            $scope.$apply();
        } else {
            angular.element(document.getElementById('loginOut')).html(signOut);
            /* TODO: change onclick */
            /*document.getElementById("#loginOut").onclick = function() {
                cikisYap();
                return false;
            };*/
            $location.url('/games');
            addon.port.emit("initialize", getUserName());
            $scope.$apply();
        }

        $scope.$digest();
    });
});

// create the controller and inject Angular's $scope
twitchLive.controller('gamesController', function($scope, $location) {
    $scope.loading = true;

    //Send port for api call to main.js
    addon.port.emit("printGames");

    //Response from main.js
    addon.port.on("gameResponse", function(gameResult, gViewers, gChannels) {
        document.getElementById("refresh").alt = "Refresh Game";

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

// create the controller and inject Angular's $scope
twitchLive.controller('streamByGameController', function($scope, $routeParams) {
    $scope.loading = true;
    //Send port for api call to main.js
    addon.port.emit("getStreamsByGame", $routeParams.gameName);

    //Response from main.js
    addon.port.on("streamByGameResponse", function(response, gViewers, gChannels) {
        document.getElementById("refresh").alt = "Refresh Game";

        $scope.list = response.streams;
        $scope.viewersText = gViewers;
        $scope.channelsText = gChannels;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit("openPage", url);
    };
});

// create the controller and inject Angular's $scope
twitchLive.controller('followingController', function($scope, $location) {
    var username = getUserName();
    if (username != null) {
        addon.port.emit("getFollowings", username);
        $scope.loading = true;
    } else {
        $location.url('/login');
    }

    document.getElementById("refresh").alt = "Refresh Followings";
    //Creating an instance for push method
    $scope.list = [];

    addon.port.on("followResponse", function(response, gViewers, gPlaying) {

        $scope.list.push(response);
        $scope.viewersText = gViewers;
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();

    });

    $scope.openPage = function(url){
        addon.port.emit("openPage", url);
    };
});

// create the controller and inject Angular's $scope
twitchLive.controller('streamsController', function($scope) {
    $scope.loading = true;

    //Send port for api call to main.js
    addon.port.emit("printStreams");

    //Response from main.js
    addon.port.on("streamResponse", function(response, gViewers, gPlaying) {
        document.getElementById("refresh").alt = "Refresh Streams";

        $scope.list = response.streams;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit("openPage", url);
    };
});


// create the controller and inject Angular's $scope
twitchLive.controller('featuredController', function($scope) {
    $scope.loading = true;

    //Send port for api call to main.js
    addon.port.emit("getFeatured");

    //Response from main.js
    addon.port.on("featuredResponse", function(response, gViewers, gPlaying) {
        document.getElementById("refresh").alt = "Refresh Featured";

        $scope.list = response.featured;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

    $scope.openPage = function(url){
        addon.port.emit("openPage", url);
    };

});


// create the controller and inject Angular's $scope
twitchLive.controller('settingsController', function($scope, $location) {

    var result = getUserName();
    if (result == "" || result == null || result == undefined) {
        addon.port.emit("getSettings", false);
    } else {
        addon.port.emit("getSettings", true);
    };

    addon.port.on("settingsResponse", function(logMsg, logInOut, refreshBtn, refreshMsg, help, createdBy) {
        var result = getUserName();

        if (result == "" || result == null || result == undefined) {
            $scope.loggedIn = false;

        } else {
            $scope.loggedIn = true;
        }

        $scope.logMsg = logMsg;
        $scope.logInOut = logInOut;
        $scope.refreshBtn = refreshBtn;
        $scope.refreshMsg = refreshMsg;
        $scope.help = help;
        $scope.createdBy = createdBy;


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
        addon.port.on('refreshFollowings', getUserName());
    };
});


// Create the controller and inject Angular's $scope
twitchLive.controller('searchController', function($scope, $routeParams) {
    // Wait for input query and send it as a search port
    $scope.$watch('query', debounce(function() {
        if ($scope.query != undefined && $scope.query != '') {
            $scope.loading = true;
            addon.port.emit("search", $scope.query);
            console.log('param here');
        }
    }, 500));

    // Response port for search query
    addon.port.on("searchResponse", function(response, gViewers, gPlaying) {
        document.getElementById("refresh").alt = "Refresh Search";

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
    if (getUserName() == null) {
        console.log('loging iningen');

        //Send port for login page strings
        addon.port.emit("loginPage");

        //Response from main.js
        addon.port.on("loginPageResponse", function(signIn, passSign, welcomeMsg) {

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
        console.log('loging outingen');
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

function getUserName() {
    var userName = localStorage.getItem("twitchName");

    return userName;
}

function setUserName(twitchName) {
    try {
        localStorage.setItem("twitchName", twitchName);
        return true;

    } catch (ex) {
        return false;
    }
}

function deleteUserName() {
    try {
        localStorage.removeItem("twitchName");
        return true;

    } catch (ex) {
        return false;
    }
}

function logOut() {
    if (getUserName() != null) {
        var result = deleteUserName();
        if (result) {
            addon.port.emit("clearTimer");

            addon.port.emit("getSignInOut");
            addon.port.on("getSignInOutResponse", function(signIn) {
                angular.element(document.getElementById('loginOut')).html(signIn);
            });

        };
    };
}
