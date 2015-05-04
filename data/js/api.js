// create the module and name it twitchLive and also include ngRoute for routing.
var twitchLive = angular.module('twitchLive', ['ngRoute']);
var response = [];


// configure our routes
twitchLive.config(function($routeProvider) {
    $routeProvider

    // route for the initial page
        .when('/', {
        templateUrl: 'templates/games.html',
        controller: 'mainController'
    })

    // route for the games page
    .when('/games', {
        templateUrl: 'templates/games.html',
        controller: 'gamesController'
    })

    // route for the streams by game page
    .when('/streamByGame/:gameName', {
        templateUrl: 'templates/streams.html',
        controller: 'streamByGameController'
    })

    // route for the following page
    .when('/following', {
        templateUrl: 'templates/featured.html',
        controller: 'followingController'
    })

    // route for the cannels page
    .when('/streams', {
        templateUrl: 'templates/streams.html',
        controller: 'streamsController'
    })

    // route for the featured page
    .when('/featured', {
        templateUrl: 'templates/featured.html',
        controller: 'featuredController'
    })

    // route for the featured page
    .when('/settings', {
        templateUrl: 'templates/settings.html',
        controller: 'settingsController'
    })

    // route for the settings page
    .when('/settings', {
        templateUrl: 'templates/streams.html',
        controller: 'searchController'
    })

    // route for the login page
    .when('/login', {
        templateUrl: 'templates/login.html',
        controller: 'loginController'
    })

    // route for the other pages
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
            angular.element(document.getElementById('loginLink')).html(signOut);
            /* TODO: change onclick */
            /*document.getElementById("#loginLink").onclick = function() {
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
        document.getElementById("refreshImg").alt = "Refresh Game";

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
        document.getElementById("refreshImg").alt = "Refresh Game";

        $scope.list = response.streams;
        $scope.viewersText = gViewers;
        $scope.channelsText = gChannels;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

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

    document.getElementById("refreshImg").alt = "Refresh Followings";
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

});

// create the controller and inject Angular's $scope
twitchLive.controller('streamsController', function($scope) {

    $scope.loading = true;
    //Send port for api call to main.js
    addon.port.emit("printStreams");

    //Response from main.js
    addon.port.on("streamResponse", function(response, gViewers, gPlaying) {
        document.getElementById("refreshImg").alt = "Refresh Streams";

        $scope.list = response.streams;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

});


// create the controller and inject Angular's $scope
twitchLive.controller('featuredController', function($scope) {

    $scope.loading = true;
    //Send port for api call to main.js
    addon.port.emit("getFeatured");

    //Response from main.js
    addon.port.on("featuredResponse", function(response, gViewers, gPlaying) {
        document.getElementById("refreshImg").alt = "Refresh Featured";

        $scope.list = response.featured;
        $scope.viewersText = gViewers
        $scope.playingText = gPlaying;
        $scope.loading = false;

        //for scope life cycle
        $scope.$digest();
    });

});


// create the controller and inject Angular's $scope
twitchLive.controller('settingsController', function($scope) {

});


// create the controller and inject Angular's $scope
twitchLive.controller('searchController', function($scope) {

});


// create the controller and inject Angular's $scope
twitchLive.controller('loginController', function($scope, $location) {

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
});

// create the controller and inject Angular's $scope
twitchLive.controller('sidebarController', function($scope, $location) {

    // Function for sidebar actve classes.
    $scope.isActive = function(viewLocation) {
        return viewLocation === $location.path();
    };

});

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


/* TODO: Change  this function, has problems */
function cikisYap() {
    if (getUserName() != null) {
        var result = deleteUserName();
        if (result) {
            addon.port.emit("clearTimer");
            printGames();
            document.getElementById("loginLink").textContent = signIn;
            document.getElementById("loginLink").onclick = function() {
                loadLoginPage();
                return false;
            };
        };
    };
}
