var signIn;
addon.port.emit("getSignInOut");
addon.port.on("getSignInOutResponse", function(_in){
	signIn = _in;
});

//Sends addon to get games, handle returning value and prints that.
function printGames(){
	loadingScreen();
	addon.port.emit("printGames");
}

addon.port.on("gameResponse", function(GameResult, gviewers, gchannels){
	clearContent();
	var contentDiv = document.getElementById("content-list");
	document.getElementById("refreshImg").alt = "Refresh Game";
	
	for(var i = 0; i< GameResult.top.length; i++){
	    /*contentDiv.innerHTML += '<a href="" onclick="getStreamsByGame(\'' + GameResult.top[i].game.name + '\'); return false;"> \
			<li> \
				<img src="'+ GameResult.top[i].game.logo.small + '" alt="" width="60" height="36"> \
				<h1>'+ GameResult.top[i].game.name+'</h1> \
				<div class="sub"> \
					<h2 class="game-h">' + GameResult.top[i].channels + " " + gchannels + " -  "+  GameResult.top[i].viewers + " " + gviewers +'</h2> \
				</div> \
			</li> \
		</a>';*/

		var a = document.createElement("a");
		a.setAttribute("href","javascript: void(0)");
		gameClickify(a,GameResult.top[i].game.name);
	
		var li = document.createElement("li");

		var img = document.createElement("img");
		img.setAttribute("src", GameResult.top[i].game.logo.small);
		img.setAttribute("alt", "");
		img.setAttribute("width", "60");
		img.setAttribute("height", "36");

		var h1 = document.createElement("h1");
		h1.appendChild(textNode(GameResult.top[i].game.name));

		var divSub = document.createElement("div");
		divSub.setAttribute("class", "sub");

		var h3 = document.createElement("h3");
		h3.setAttribute("class", "game-h")
		h3.appendChild(textNode(GameResult.top[i].channels + " " + gchannels + " -  "+  GameResult.top[i].viewers + " " + gviewers));

		divSub.appendChild(h3);

		li.appendChild(img);
		li.appendChild(h1);
		li.appendChild(divSub);

		a.appendChild(li);
		contentDiv.appendChild(a);

	};
});

// Sends addon to get following channels. handle returning value and prints that.
function getFollowings(){
	loadingScreen();
	var username = getUserName();
	if(username != null){
		addon.port.emit("getFollowings", username);
	}else{
		loadLoginPage();
	}
}

addon.port.on("followResponse", function(followResult, gviewers, gplaying){
	var contentDiv = document.getElementById("content-list");
	document.getElementById("refreshImg").alt = "Refresh Followings";

	/*contentDiv.innerHTML += '<a href="'+ followResult.stream.channel.url +'" target="_blank"> \
					<li> \
						<img src="'+ followResult.stream.preview.small + '" alt="" width="80" height="50"> \
						<h1>'+followResult.stream.channel.status.substring(0,35) +'...</h1> \
						<div class="sub"> \
							<h2>'+followResult.stream.channel.display_name + ' - '+ followResult.stream.viewers +" " +gviewers +'</h2> \
							<h2>' + gplaying + " " + followResult.stream.game +'</h2> \
						</div> \
					</li> \
				</a>';*/

		var a = document.createElement("a");
		a.setAttribute("href", followResult.stream.channel.url);
		a.setAttribute("target", "_blank");

		var li = document.createElement("li");

		var img = document.createElement("img");
		img.setAttribute("src", followResult.stream.preview.small);
		img.setAttribute("alt", "");
		img.setAttribute("width", "80");
		img.setAttribute("height", "50");

		var h1 = document.createElement("h1");
		h1.appendChild(textNode(followResult.stream.channel.status.substring(0,35) + "..."));

		var divSub = document.createElement("div");
		divSub.setAttribute("class", "sub");

		var h2 = document.createElement("h2");
		h2.appendChild(textNode(followResult.stream.channel.display_name + ' - '+ followResult.stream.viewers +" " +gviewers));
		var h22 = document.createElement("h2");
		h22.appendChild(textNode(gplaying + " " + followResult.stream.game));

		divSub.appendChild(h2);
		divSub.appendChild(h22);

		li.appendChild(img);
		li.appendChild(h1);
		li.appendChild(divSub);

		a.appendChild(li);
		contentDiv.appendChild(a);

});

// I had to do this because of when getting the following streams i had an issue about clearing the div too soon.
addon.port.on("clearContent", function(noStream){
	clearContent();
	if (noStream != "") {
		var contentDiv = document.getElementById("content-list");
		clearContent();

		//contentDiv.innerHTML = '<div class="alert warning-box">'+ noStream +'</div>';
		var div= document.createElement("div");
		div.setAttribute("class", "alert warning-box");
		div.appendChild(textNode(noStream));
		contentDiv.appendChild(div);
		
	};
});

function printStreams(){
	loadingScreen();

	addon.port.emit("printStreams");
}

addon.port.on("streamResponse", function(response, gviewers, gplaying){
	clearContent();
	var contentDiv = document.getElementById("content-list");
	document.getElementById("refreshImg").alt = "Refresh Streams";

	for (var i = 0; i < response.streams.length; i++) {
		
		/*contentDiv.innerHTML += '<a href="'+ response.streams[i].channel.url +'" target="_blank"> \
			<li> \
				<img src="'+ response.streams[i].preview.small + '" alt="" width="80" height="50"> \
				<h1>'+ response.streams[i].channel.status.substring(0,35)+ '...</h1> \
				<div class="sub"> \
					<h2>'+ response.streams[i].channel.display_name + ' - ' + response.streams[i].viewers+" "+ gviewers +'</h2> \
					<h2>'+ gplaying + " " + response.streams[i].game  +'</h2> \
				</div> \
			</li> \
		</a>';*/

		var a = document.createElement("a");
		a.setAttribute("href", response.streams[i].channel.url);
		a.setAttribute("target", "_blank");

		var li = document.createElement("li");

		var img = document.createElement("img");
		img.setAttribute("src", response.streams[i].preview.small);
		img.setAttribute("alt", "");
		img.setAttribute("width", "80");
		img.setAttribute("height", "50");

		var h1 = document.createElement("h1");
		h1.appendChild(textNode(response.streams[i].channel.status.substring(0,35) + "..."));

		var divSub = document.createElement("div");
		divSub.setAttribute("class", "sub");

		var h2 = document.createElement("h2");
		h2.appendChild(textNode(response.streams[i].channel.display_name + ' - ' + response.streams[i].viewers+" "+ gviewers));
		var h22 = document.createElement("h2");
		h22.appendChild(textNode(gplaying + " " + response.streams[i].game));

		divSub.appendChild(h2);
		divSub.appendChild(h22);

		li.appendChild(img);
		li.appendChild(h1);
		li.appendChild(divSub);

		a.appendChild(li);
		contentDiv.appendChild(a);
	};
});

function getStreamsByGame(gameName){
	loadingScreen();
	addon.port.emit("getStreamsByGame", gameName);
}

addon.port.on("streamByGameResponse", function(response, gviewers, gplaying){
	clearContent();
	var contentDiv = document.getElementById("content-list");
	document.getElementById("refreshImg").alt = "Refresh GameBasedStream"+response.streams[0].game;

	for(var i = 0; i < response.streams.length; i++){
		/*contentDiv.innerHTML += '<a href="'+ response.streams[i].channel.url +'" target="_blank"> \
				<li> \
					<img src="'+ response.streams[i].preview.small + '" alt="" width="80" height="50"> \
					<h1>'+ response.streams[i].channel.status.substring(0,35)+ '...</h1> \
					<div class="sub"> \
						<h2>'+ response.streams[i].channel.display_name + ' - ' + response.streams[i].viewers+ " "+ gviewers +'</h2> \
						<h2>' + gplaying + " " + response.streams[i].game +'</h2> \
					</div> \
				</li> \
			</a>';*/

		var a = document.createElement("a");
		a.setAttribute("href", response.streams[i].channel.url);
		a.setAttribute("target", "_blank");

		var li = document.createElement("li");

		var img = document.createElement("img");
		img.setAttribute("src", response.streams[i].preview.small);
		img.setAttribute("alt", "");
		img.setAttribute("width", "80");
		img.setAttribute("height", "50");

		var h1 = document.createElement("h1");
		h1.appendChild(textNode(response.streams[i].channel.status.substring(0,35) + "..."));

		var divSub = document.createElement("div");
		divSub.setAttribute("class", "sub");

		var h2 = document.createElement("h2");
		h2.appendChild(textNode(response.streams[i].channel.display_name + ' - ' + response.streams[i].viewers+" "+ gviewers));
		var h22 = document.createElement("h2");
		h22.appendChild(textNode(gplaying + " " + response.streams[i].game));

		divSub.appendChild(h2);
		divSub.appendChild(h22);

		li.appendChild(img);
		li.appendChild(h1);
		li.appendChild(divSub);

		a.appendChild(li);
		contentDiv.appendChild(a);
	};
});

function getFeatured(){
	loadingScreen();

	addon.port.emit("getFeatured");
}

addon.port.on("featuredResponse", function(response, gviewers, gplaying){
	clearContent();
	var contentDiv = document.getElementById("content-list");
	document.getElementById("refreshImg").alt = "Refresh Featured";

	for (var i = 0; i < response.featured.length; i++) {
		
		/*contentDiv.innerHTML += '<a href="'+ response.featured[i].stream.channel.url +'" target="_blank"> \
			<li> \
				<img src="'+ response.featured[i].stream.preview.small + '" alt="" width="80" height="50"> \
				<h1>'+ response.featured[i].stream.channel.status.substring(0,35)+ '...</h1> \
				<div class="sub"> \
					<h2>'+ response.featured[i].stream.channel.display_name + ' - ' + response.featured[i].stream.viewers+ " "+ gviewers +'</h2> \
					<h2>'+ gplaying + " " + response.featured[i].stream.game  +'</h2> \
				</div> \
			</li> \
		</a>';*/

		var a = document.createElement("a");
		a.setAttribute("href", response.featured[i].stream.channel.url);
		a.setAttribute("target", "_blank");

		var li = document.createElement("li");

		var img = document.createElement("img");
		img.setAttribute("src", response.featured[i].stream.preview.small);
		img.setAttribute("alt", "");
		img.setAttribute("width", "80");
		img.setAttribute("height", "50");

		var h1 = document.createElement("h1");
		h1.appendChild(textNode(response.featured[i].stream.channel.status.substring(0,35) + "..."));

		var divSub = document.createElement("div");
		divSub.setAttribute("class", "sub");

		var h2 = document.createElement("h2");
		h2.appendChild(textNode(response.featured[i].stream.channel.display_name + ' - ' + response.featured[i].stream.viewers+ " "+ gviewers));
		var h22 = document.createElement("h2");
		h22.appendChild(textNode(gplaying + " " + response.featured[i].stream.game));

		divSub.appendChild(h2);
		divSub.appendChild(h22);

		li.appendChild(img);
		li.appendChild(h1);
		li.appendChild(divSub);

		a.appendChild(li);
		contentDiv.appendChild(a);
	};
});

addon.port.on("searchResponse", function(response, gviewers, gplaying){
	clearContent();
	var contentDiv = document.getElementById("content-list");
	document.getElementById("refreshImg").alt = "Refresh Search";

	for(var i = 0; i < response.streams.length; i++){
		/*contentDiv.innerHTML += '<a href="'+ response.streams[i].channel.url +'" target="_blank"> \
				<li> \
					<img src="'+ response.streams[i].preview.small + '" alt="" width="80" height="50"> \
					<h1>'+ response.streams[i].channel.status.substring(0,35)+ '...</h1> \
					<div class="sub"> \
						<h2>'+ response.streams[i].channel.display_name + ' - ' + response.streams[i].viewers+ " " + gviewers +'</h2> \
						<h2>' +gplaying + " " + response.streams[i].game  +'</h2> \
					</div> \
				</li> \
			</a>';*/


		var a = document.createElement("a");
		a.setAttribute("href", response.streams[i].channel.url);
		a.setAttribute("target", "_blank");

		var li = document.createElement("li");

		var img = document.createElement("img");
		img.setAttribute("src", response.streams[i].preview.small);
		img.setAttribute("alt", "");
		img.setAttribute("width", "80");
		img.setAttribute("height", "50");

		var h1 = document.createElement("h1");
		h1.appendChild(textNode(response.streams[i].channel.status.substring(0,35) + "..."));

		var divSub = document.createElement("div");
		divSub.setAttribute("class", "sub");

		var h2 = document.createElement("h2");
		h2.appendChild(textNode(response.streams[i].channel.display_name + ' - ' + response.streams[i].viewers+" "+ gviewers));
		var h22 = document.createElement("h2");
		h22.appendChild(textNode(gplaying + " " + response.streams[i].game));

		divSub.appendChild(h2);
		divSub.appendChild(h22);

		li.appendChild(img);
		li.appendChild(h1);
		li.appendChild(divSub);

		a.appendChild(li);
		contentDiv.appendChild(a);
	};
});

function clearContent() {
	var contentDiv = document.getElementById("content-list");
	contentDiv.innerHTML = "";
};

function refreshContent() {

	clearContent();
	var content = document.getElementById("refreshImg").alt;
	var content = content.substring(8);

	if(content == "Game"){
		printGames();
	}else if(content == "Followings"){
		getFollowings();
	}else if(content == "Streams"){
		printStreams();
	}else if(content == "GameBasedStream"){
		content = content.substring(15);
		getStreamsByGame(content);
	}else if(content == "Featured"){
		getFeatured();
	}
}	


function setUserName(twitchName){
	try{

		localStorage.setItem("twitchName",twitchName);
		return true;

	}catch(ex) {
		return false;
	}


}

function getUserName() {
	var userName = localStorage.getItem("twitchName");

	return userName;
}

function deleteUserName() {

	try{

		localStorage.removeItem("twitchName");

		return true;
	}catch(ex) {
		return false;
	}

}

//setting a port for localization.
function loadLoginPage(){
	addon.port.emit("loginPage");
}

addon.port.on("loginPageResponse",function(signIn, passSign, welcomeMsg){
	clearContent();

	var contentDiv = document.getElementById("content-list");

	/*contentDiv.innerHTML = '<div class="alert success-box">'+ welcomeMsg +'</div><form name="login-form>"<div id="login-section"> \
	<input type="text" placeholder="Twitch User Name" id="username" class="login-input"><br> \
	<button class="button" onclick="login()" type="submit">'+ signIn +'</button> \
	<a href="" onclick="printGames(); return false;">'+ passSign +'</a> \
	</div></form>';*/

	// The content changed because of firefox addon security policy
	var d = document.createElement("div");
	d.setAttribute("class", "alert success-box");
	d.appendChild(document.createTextNode(welcomeMsg));

	var f = document.createElement("form");
	f.setAttribute("name","login-form");

	var d2 = document.createElement("div");
	d2.setAttribute("id","login-section");

	var i = document.createElement("input");
	i.setAttribute("type","text");
	i.setAttribute("placeholder","Twitch User Name");
	i.setAttribute("id", "username");
	i.setAttribute("class", "login-input");

	var br = document.createElement("br");

	var button = document.createElement("button");
	button.setAttribute("class", "button");
	button.onclick = function() { login() };
	button.setAttribute("type", "submit");
	button.appendChild(document.createTextNode(signIn));

	var a = document.createElement("a");
	a.setAttribute("href", "javascript:void(0)");
	a.onclick = function() { printGames() };
	a.appendChild(document.createTextNode(passSign));

	d2.appendChild(i);
	d2.appendChild(br);
	d2.appendChild(button);
	d2.appendChild(a);
	f.appendChild(d2);

	contentDiv.appendChild(d);
	contentDiv.appendChild(f);

});

function cikisYap(){
	if(getUserName != null){
		var sonuc = deleteUserName();
		if(sonuc){
			addon.port.emit("clearTimer");
			printGames();
			document.getElementById("header-login").textContent = signIn;
			document.getElementById("login-a").onclick = function () {
				loadLoginPage();
 	 			return false;
			};
		};
	};
}

//setting a port for localization.
function loadCheck() {
	addon.port.emit("getLoadCheck");
}
addon.port.on("getLoadCheckResponse", function(signOut){
		var firstTime= localStorage.getItem("twitchLiveFirst");


	if( (firstTime == null || firstTime == true) && getUserName() == null){ // I did "firstTime == true" just in case of new update or smth.
		localStorage.setItem("twitchLiveFirst", false);
		loadLoginPage();
	}else{
		document.getElementById("header-login").textContent = signOut;
		document.getElementById("login-a").onclick = function () {
			cikisYap();
 	 		return false;
		};
		printGames();
		addon.port.emit("initialize", getUserName());
	}
});

function login(){
	var username = document.getElementById("username").value;
	setUserName(username);
	location.reload();
}

function loadingScreen(){
	var contentDiv = document.getElementById("content-list");
	contentDiv.innerHTML = '<div id="loading-screen"><img src="img/loading.gif" width="100" height="100"></div>';

}

function aramaYap(){
	loadingScreen();
	var query = document.getElementById("search-input").value;
	addon.port.emit("search", query);
}


function getSettings(){
	var result = getUserName();
	if (result == "" || result == null || result == undefined) {
		addon.port.emit("getSettings", false);
	}else{
		addon.port.emit("getSettings", true);
	};
}

addon.port.on("settingsResponse", function(logMsg, logInOut, refreshBtn, refreshMsg, help, createdBy){
	var result = getUserName();
	clearContent();
	var contentDiv = document.getElementById("content-list");

	if (result == "" || result == null || result == undefined) {
		//contentDiv.innerHTML = '<div class="alert warning-box">'+ logMsg +'</div>';
		//contentDiv.innerHTML += '<button class="button" onclick="loadLoginPage()" type="button">'+ logInOut +'</button><br>';

		var d = document.createElement("div");
		d.setAttribute("class", "alert warning-box");
		d.appendChild(document.createTextNode(logMsg));

		var b = document.createElement("button");
		b.setAttribute("class", "button");
		b.onclick = function() { loadLoginPage() };
		b.setAttribute("type", "button");
		b.appendChild(document.createTextNode(logInOut));

		contentDiv.appendChild(d);
		contentDiv.appendChild(b);

	}else{
		/*contentDiv.innerHTML = '<div class="alert success-box">'+ logMsg +" " + result +'</div>';
		contentDiv.innerHTML += '<button class="button" onclick="cikisYap()" type="button">'+ logInOut +'</button><br>';

		contentDiv.innerHTML += ' <div class="clear"></div><button class="button" onclick="refreshFollowings()" type="button">'+ refreshBtn +'</button> \
			<div class="clear"></div><div class="alert info-box">'+ refreshMsg +'</div>';
		*/
		var d = document.createElement("div");
		d.setAttribute("class", "alert success-box");
		d.appendChild(document.createTextNode(logMsg + " " + result));

		var b = document.createElement("button");
		b.setAttribute("class", "button");
		//b.setAttribute("onclick","cikisYap()");
		b.onclick = function() { cikisYap() };
		b.setAttribute("type", "button");
		b.appendChild(document.createTextNode(logInOut));

		var d2 = document.createElement("div");
		d2.setAttribute("class", "clear");

		var b2 = document.createElement("button");
		b2.setAttribute("class", "button");
		b2.onclick = function() { refreshFollowings() };
		b2.setAttribute("type", "button");
		b2.appendChild(document.createTextNode(refreshBtn));

		contentDiv.appendChild(d);
		contentDiv.appendChild(b);
		contentDiv.appendChild(d2);
		contentDiv.appendChild(b2);
	};


	/*contentDiv.innerHTML += '<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="hosted_button_id" value="GD324N9HBY3PU">
<input type="image" src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal – The safer, easier way to pay online.">
<img alt="" border="0" src="https://www.paypalobjects.com/tr_TR/i/scr/pixel.gif" width="1" height="1">
</form>;*/
	var clear = document.createElement("div");
	clear.setAttribute("class","clear");
	contentDiv.appendChild(clear);

	var alertDiv = document.createElement("div");
	alertDiv.setAttribute("class", "alert info-box");

	var form = document.createElement("form");
	form.setAttribute("action", "https://www.paypal.com/cgi-bin/webscr");
	form.setAttribute("method", "post");
	form.setAttribute("target", "_blank");

	var in1 = document.createElement("input");
	in1.setAttribute("type", "hidden");
	in1.setAttribute("name", "cmd");
	in1.setAttribute("value", "_s-xclick");

	var in2 = document.createElement("input");
	in2.setAttribute("type", "hidden");
	in2.setAttribute("name", "hosted_button_id");
	in2.setAttribute("value", "GD324N9HBY3PU");

	var in3 = document.createElement("input");
	in3.setAttribute("type", "image");
	in3.setAttribute("src", "https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif");
	in3.setAttribute("border", "0");
	in3.setAttribute("name", "submit");
	in3.setAttribute("alt", "PayPal – The safer, easier way to pay online.");

	var img = document.createElement("img");
	img.setAttribute("alt", "");
	img.setAttribute("border", "0");
	img.setAttribute("src", "https://www.paypalobjects.com/tr_TR/i/scr/pixel.gif");
	img.setAttribute("width", "1");
	img.setAttribute("height", "1");

	form.appendChild(in1);
	form.appendChild(in2);
	form.appendChild(in3);
	form.appendChild(img);

	alertDiv.appendChild(document.createTextNode(help));
	alertDiv.appendChild(form);
	alertDiv.appendChild(document.createElement("br"));
	alertDiv.appendChild(document.createTextNode(createdBy));

	contentDiv.appendChild(alertDiv);
});

function refreshFollowings(){
	var uName = getUserName();
	addon.port.emit("refreshFollowings", uName);
}
function textNode(text){
	return document.createTextNode(text);
}

function gameClickify(elem, gamee) {
    elem.onclick = function (event) { getStreamsByGame(gamee) };
}