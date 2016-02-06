// Firefox Add-on Requires
var self = require("sdk/self"),
    buttons = require('sdk/ui/button/action'),
    panels = require("sdk/panel"),
    Request = require("sdk/request").Request,
    tmr = require("sdk/timers"),
    notifications = require("sdk/notifications"),
    tabs = require("sdk/tabs"),
    _ = require("sdk/l10n").get,
    ss = require("sdk/simple-storage");

// APU Urls
var streamAPI = "https://api.twitch.tv/kraken/streams/",
    gameAPI = "https://api.twitch.tv/kraken/games/top",
    channelAPI = "https://api.twitch.tv/kraken/streams?limit=50",
    followingPre = "https://api.twitch.tv/kraken/users/",
    followingSuff = "/follows/channels?limit=500",
    featuredAPI = "https://api.twitch.tv/kraken/streams/featured?limit=50",
    searchAPI = "https://api.twitch.tv/kraken/search/streams",
    isFirst = true,
    followingNames = [],
    liveFollowings = [],
    newLiveFollowings = [],
    intervalID;


// Executes after extension loads.
exports.main = function(options, callbacks) {

    // Localization variables
    var viewers = " " + _("viewers"),
        channels = " " + _("channels"),
        playing = _("playing"),
        signIn = _("sign_in"),
        signOut = _("sign_out"),
        noStreams = _("no_streams");



    // Action Button Initialize
    var button = buttons.ActionButton({
        id: "twitch-live",
        label: "Twitch Live",
        icon: {
            "16": "./icons/twitch-icon-32.png",
            "32": "./icons/twitch-icon-32.png",
            "64": "./icons/twitch-icon-64.png",
            "128": "./icons/twitch-icon-128.png"
        },
        onClick: handleClick
    });


    // Panel Initialize
    var panel = panels.Panel({
        contentURL: self.data.url("panel.html"),
        width: 400,
        height: 555
    });

    // Action Button Click Handler
    function handleClick(state) {
        panel.show({
            position: button
        });
    }

    // These helpers might be deleted
    function getStorageItem(item) {
        return ss.storage.item;
    }

    function setStorageItem(item, val) {
        ss.storage.item = val;
    }

    function deleteStorageItem(item) {
        delete ss.storage.item;
    }

    // Panel Ports for Communitions
    panel.port.on("getFollowings", function(userName) {

        isFirst = true;
        if (followingNames.length == 0) {
            panel.port.emit("clearContent", noStreams);
        }

        for (var i = 0; i < followingNames.length; i++) {
            if (i == followingNames.length - 1) {
                printFollowing(followingNames[i], true);
            } else {
                printFollowing(followingNames[i]);
            };
        };
    });

    function printFollowing(name, isLast) {
        var apiRequest = Request({

            url: streamAPI + encodeURIComponent(name),
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                if (response.json.stream != null) {
                    if (isFirst === true) {
                        panel.port.emit("clearContent", "");
                        isFirst = false;
                    };
                    panel.port.emit("followResponse", response.json, viewers, playing);
                }
                if (isFirst == true && isLast == true) {
                    panel.port.emit("clearContent", noStreams); // If there is no online channel, then its stop loading.
                };
            }
        });
        apiRequest.get();
    }

    panel.port.on("printGames", function() {
        var apiRequest = Request({

            url: gameAPI,
            content: {
                limit: 50
            },
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit("gameResponse", response.json, viewers, channels);

            }
        });
        apiRequest.get();
    });

    panel.port.on("printStreams", function() {
        var apiRequest = Request({

            url: streamAPI + "?limit=50",
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit("streamResponse", response.json, viewers, playing);

            }
        });
        apiRequest.get();
    });

    panel.port.on("getStreamsByGame", function(gameName) {
        var apiRequest = Request({

            url: streamAPI + "?limit=50",
            content: { 
                game : gameName
            },
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit("streamByGameResponse", response.json, viewers, playing);
            }
        });
        apiRequest.get();


    });

    panel.port.on("getFeatured", function() {
        var apiRequest = Request({

            url: featuredAPI,
            content: {
                limit: 50
            },
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit("featuredResponse", response.json, viewers, playing);
            }
        });
        apiRequest.get();
    });

    panel.port.on("search", function(query) {
        var apiRequest = Request({

            url: searchAPI,
            content: {
                q: encodeURIComponent(query)
            },
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                panel.port.emit("searchResponse", response.json, viewers, playing);
            }
        });
        apiRequest.get();
    });

    panel.port.on("initialize", function(username) {
        followingCheck(username, function() {
            //firstly i'm initializing a postnotify and then im setting it to do that for 5mins(300000 ms) repeatedly.
            postNotify();
            intervalID = tmr.setInterval(postNotify, 300000);
        });
        
        
    });

    function followingCheck(username, callback) {
        if (username != undefined) {
            var followUrl = followingPre + username + followingSuff;

            var apiRequest = Request({
                url: followUrl,
                headers: {
                    'Cache-control': 'no-cache'
                },
                onComplete: function(response) {
                    if (response.json.follows != undefined) {
                        for (var i = 0; i < response.json.follows.length; i++) {
                            followingNames[i] = response.json.follows[i].channel.name;
                        }

                        // If callback parameter is filled run it.
                        if (callback && typeof(callback) === "function") {
                            callback();
                        }
                    }
                }
            });

            apiRequest.get();
        };
    }

    function postNotify() {
        var a = 0;
        var index = 0;
        var yayincilarText = "";

        if (liveFollowings.length == 0) { // live followings boşsa buraya girer doluysa karşılaştırma yapmak adına diğer listi doldurmak için else e girer
            for (var i = 0; i < followingNames.length; i++) {
                var apiRequest = Request({

                    url: streamAPI + encodeURIComponent(followingNames[i]),
                    headers: {
                        'Cache-control': 'no-cache'
                    },
                    onComplete: function(response) {
                        if (response.json.stream != null) {
                            liveFollowings[a++] = response.json.stream.channel.display_name;
                        }
                        index++;
                        if (index == followingNames.length) {
                            for (var j = 0; j < liveFollowings.length; j++) {
                                yayincilarText += liveFollowings[j] + ", ";
                            };
                            yayincilarText = yayincilarText.slice(0, -2);
                            yayincilarText += " " + _("now_online");
                            notify(yayincilarText, a, false);
                        };

                    }
                });
                apiRequest.get();
            }
        } else {
            for (var i = 0; i < followingNames.length; i++) {
                var apiRequest = Request({

                    url: streamAPI + encodeURIComponent(followingNames[i]),
                    headers: {
                        'Cache-control': 'no-cache'
                    },
                    onComplete: function(response) {
                        if (response.json.stream != null) {
                            newLiveFollowings[a++] = response.json.stream.channel.display_name;
                        }
                        index++;
                        if (index == followingNames.length) {
                            var nowOnlineCount = 0;

                            for (var j = 0; j < newLiveFollowings.length; j++) {
                                if (!include(liveFollowings, newLiveFollowings[j])) {
                                    yayincilarText += newLiveFollowings[j] + ", ";
                                    nowOnlineCount++;
                                };
                            };
                            if (yayincilarText != "") {
                                yayincilarText = yayincilarText.slice(0, -2); // to delete the last ", " letters.
                                yayincilarText += " " + _("now_online");
                                notify(yayincilarText, nowOnlineCount, true);
                            };
                        };
                    }
                });
                apiRequest.get();
            }
        };

    }

    function include(arr, obj) {
        return (arr.indexOf(obj) != -1);
    }

    function notify(ntext, a, newLive) {
        if (a == 1) {
            notifications.notify({
                title: ntext,
                text: ntext,
                iconURL: './icons/twitch-icon-128.png',
                onClick: function() {
                    tabs.open("http://www.twitch.tv/directory/following");
                }
            });
        } else if (a > 1) {
            notifications.notify({
                title: a + " " + _("streamers_online"),
                text: ntext,
                iconURL: './icons/twitch-icon-128.png',
                onClick: function() {
                    tabs.open("http://www.twitch.tv/directory/following");
                }
            });
        };

        if (newLive) { //eğer newlivefollowings dolduysa onun verilerini ilk arraye atıyoruz ve arrayi sıfırlıyoruz.
            liveFollowings = [];
            liveFollowings = newLiveFollowings;
            newLiveFollowings = [];
        };
    }

    panel.port.on("clearTimer", function() {
        tmr.clearInterval(intervalID);
        followingNames = [];
        liveFollowings = [];
        newLiveFollowings = [];
    });


    //Ports for localizations.
    panel.port.on("loginPage", function() {
        panel.port.emit("loginPageResponse", signIn, _("pass_sign"), _("welcome_msg"));
    });

    panel.port.on("getSignInOut", function() {
        var userName = getStorageItem("twitchName");

        if (userName == null) {
            panel.port.emit("getSignInOutResponse", signIn);
        } else {
            panel.port.emit("getSignInOutResponse", signOut);
        }
        
    });

    panel.port.on("getLoadCheck", function() {
        console.log('why load whyyyy');
        panel.port.emit("getLoadCheckResponse", signOut);
    })


    panel.port.on("getSettings", function(isLogged) {
        if (isLogged) {
            panel.port.emit("settingsResponse", _("logged_as"), signOut, _("refresh_fl_btn"), _("refresh_followed"), _("donate"), _("created_by"));
        } else {

            panel.port.emit("settingsResponse", _("not_logged_yet"), signIn, _("refresh_fl_btn"), _("refresh_followed"), _("donate"), _("created_by"));
        };
    });

    // Refresh Followings
    panel.port.on("refreshFollowings", function(username) {
        followingCheck(username);
    });

    // Open Url
    panel.port.on("openPage", function(url) {
        tabs.open(url);
    });


    // Set Simple Storage Item
    panel.port.on("setStorage", function(key, value) {
        setStorageItem(key, value);
    });

    // Get Simple Storage Item
    panel.port.on("getStorage", function(key) {
        panel.port.emit('getStorageResponse', getStorageItem(key));
    });

    // Delete Simple Storage Item
    panel.port.on("deleteStorage", function(key) {
        deleteStorageItem(key)
    });
};
