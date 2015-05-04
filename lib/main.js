//Firefox add-on requires
var buttons = require('sdk/ui/button/action'),
    panels = require("sdk/panel"),
    self = require("sdk/self"),
    Request = require("sdk/request").Request,
    tmr = require("sdk/timers"),
    notifications = require("sdk/notifications"),
    tabs = require("sdk/tabs"),
    _ = require("sdk/l10n").get, // localization
    ss = require("sdk/simple-storage");

// api urls
var streamAPI = "https://api.twitch.tv/kraken/streams/", //sonuna bir channel ismi gelince o streami alır.
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

    //Localization variables
    var viewers = " " + _("viewers"),
        channels = " " + _("channels"),
        playing = _("playing"),
        signIn = _("sign_in"),
        signOut = _("sign_out"),
        noStreams = _("no_streams");



    // Action Button Initialize
    var button = buttons.ActionButton({
        id: "twitch-icon",
        label: "Twitch Live",
        icon: {
            "16": "./twitch-icon-32.png",
            "32": "./twitch-icon-32.png",
            "64": "./twitch-icon-64.png"
        },
        onClick: handleClick
    });


    // Panel Initialize
    var normalPanel = panels.Panel({
        contentURL: self.data.url("panel.html"),
        width: 400,
        height: 555
    });

    // Action Button Click Handler
    function handleClick(state) {
        //if(state.checked) {
        normalPanel.show({
            position: button
        });
        //}
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
    normalPanel.port.on("getFollowings", function(userName) {

        isFirst = true;
        if (followingNames.length == 0) {
            normalPanel.port.emit("clearContent", noStreams);
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
                        normalPanel.port.emit("clearContent", "");
                        isFirst = false;
                    };
                    normalPanel.port.emit("followResponse", response.json, viewers, playing);
                }
                if (isFirst == true && isLast == true) {
                    normalPanel.port.emit("clearContent", noStreams); //if there is no online channel, then its stop loading.
                };
            }
        });
        apiRequest.get();
    }

    normalPanel.port.on("printGames", function() {
        var apiRequest = Request({

            url: gameAPI,
            content: {
                limit: 50
            },
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                normalPanel.port.emit("gameResponse", response.json, viewers, channels);

            }
        });
        apiRequest.get();
    });

    normalPanel.port.on("printStreams", function() {
        var apiRequest = Request({

            url: streamAPI + "?limit=50",
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                normalPanel.port.emit("streamResponse", response.json, viewers, playing);

            }
        });
        apiRequest.get();
    });

    normalPanel.port.on("getStreamsByGame", function(gameName) {
        var apiRequest = Request({

            url: streamAPI + "?limit=50",
            content: { 
                game : gameName
            },
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                normalPanel.port.emit("streamByGameResponse", response.json, viewers, playing);
            }
        });
        apiRequest.get();


    });

    normalPanel.port.on("getFeatured", function() {

        var apiRequest = Request({

            url: featuredAPI,
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                normalPanel.port.emit("featuredResponse", response.json, viewers, playing);
            }
        });
        apiRequest.get();
    });

    normalPanel.port.on("search", function(query) {
        var apiRequest = Request({

            url: searchAPI,
            content: {
                q: encodeURIComponent(query)
            },
            headers: {
                'Cache-control': 'no-cache'
            },
            onComplete: function(response) {
                normalPanel.port.emit("searchResponse", response.json, viewers, playing);
            }
        });
        apiRequest.get();
    });

    normalPanel.port.on("initialize", function(username) {
        followingCheck(username);
        //firstly i'm initializing a postnotify and then im setting it to do that for 5mins(300000 ms) repeatedly.
        tmr.setTimeout(function() {
            postNotify();
            intervalID = tmr.setInterval(postNotify, 300000);
        }, 7000);
    });

    function followingCheck(username) {
        if (username != undefined) {
            var followUrl = followingPre + username + followingSuff;
            var apiRequest = Request({

                url: followUrl,
                headers: {
                    'Cache-control': 'no-cache'
                },
                onComplete: function(response) {
                    for (var i = 0; i < response.json.follows.length; i++) {
                        followingNames[i] = response.json.follows[i].channel.name;
                    };

                }
            });
            apiRequest.get();
        };
    }

    function postNotify() {
        //console.log("post notify a girdik. amanda aman. " + followingNames.length);
        var a = 0;
        var index = 0;
        var yayincilarText = "";

        if (liveFollowings.length == 0) { // live followings boşsa buraya girer doluysa karşılaştırma yapmak adına diğer listi doldurmak için else e girer
            //console.log("live followings boşsa buraya giriyor.");
            for (var i = 0; i < followingNames.length; i++) {
                var apiRequest = Request({

                    url: streamAPI + encodeURIComponent(followingNames[i]),
                    headers: {
                        'Cache-control': 'no-cache'
                    },
                    onComplete: function(response) {
                        if (response.json.stream != null) {
                            //console.log("girdi notify a girdi " + response.json.stream.channel.display_name);
                            liveFollowings[a++] = response.json.stream.channel.display_name;
                            //console.log(index+". sirada ve max" + followingNames.length);
                        }
                        index++;
                        if (index == followingNames.length) {
                            //console.log("bitti isimler a");
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
            //console.log("live followings doluysa buraya giriyor.");
            for (var i = 0; i < followingNames.length; i++) {
                var apiRequest = Request({

                    url: streamAPI + encodeURIComponent(followingNames[i]),
                    headers: {
                        'Cache-control': 'no-cache'
                    },
                    onComplete: function(response) {
                        if (response.json.stream != null) {
                            //console.log("notify a girdi " + response.json.stream.channel.display_name);
                            newLiveFollowings[a++] = response.json.stream.channel.display_name;
                        }
                        index++;
                        if (index == followingNames.length) {
                            //console.log("bitti isimler ve en karsılastırmaya geldi sira.");
                            var nowOnlineCount = 0;

                            for (var j = 0; j < newLiveFollowings.length; j++) {
                                if (!include(liveFollowings, newLiveFollowings[j])) {
                                    yayincilarText += newLiveFollowings[j] + ", ";
                                    nowOnlineCount++;
                                };
                            };
                            //console.log("text: '" + yayincilarText+ "'");
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
                onClick: function() {
                    tabs.open("http://www.twitch.tv/directory/following");
                }
            });
        } else if (a > 1) {
            notifications.notify({
                title: a + " " + _("streamers_online"),
                text: ntext,
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

    normalPanel.port.on("clearTimer", function() {

        tmr.clearInterval(intervalID);
        //console.log("cleared interval");
        followingNames = [];
        liveFollowings = [];
        newLiveFollowings = [];

    });


    //Ports for localizations.
    normalPanel.port.on("loginPage", function() {
        normalPanel.port.emit("loginPageResponse", signIn, _("pass_sign"), _("welcome_msg"));
    });

    normalPanel.port.on("getSignInOut", function() {
        normalPanel.port.emit("getSignInOutResponse", signIn);
    });
    normalPanel.port.on("getLoadCheck", function() {
        normalPanel.port.emit("getLoadCheckResponse", signOut);
    })


    normalPanel.port.on("getSettings", function(isLogged) {
        //console.log("main handle tamam");
        if (isLogged) {
            normalPanel.port.emit("settingsResponse", _("logged_as"), signOut, _("refresh_fl_btn"), _("refresh_followed"), _("donate"), _("created_by"));
        } else {

            normalPanel.port.emit("settingsResponse", _("not_logged_yet"), signIn, _("refresh_fl_btn"), _("refresh_followed"), _("donate"), _("created_by"));
        };
    });


    normalPanel.port.on("refreshFollowings", function(username) {
        followingCheck(username);
    })

};
