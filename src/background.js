chrome.extension.onConnect.addListener(function(port) {
	if (port.name == "content-background") {
		port.onMessage.addListener(function(msg) {
			if (msg.action == 'movies') {
				var queryArgs = {
					"apikey": localStorage.getItem('settings_rotten_api_key')
				};
				jQuery.extend(queryArgs, msg.queryArgs);
				jQuery.get("http://api.rottentomatoes.com/api/public/v1.0/movies.json", queryArgs, function(jsonReturn) {
					port.postMessage({response: "movies", responseData: jsonReturn});
				}, "json");
			}
			else if (msg.action == 'loadSettings') {
				port.postMessage({response: 'loadSettings', responseData: {
						meter_shows_whos_score: parseInt(localStorage.getItem("settings_meter_shows_whos_score")),
						rotten_api_key: localStorage.getItem("settings_rotten_api_key")
					}
				});
			}
		});
	}
});
