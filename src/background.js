chrome.extension.onConnect.addListener(function(port) {
	if (port.name == "content-background") {
		port.onMessage.addListener(function(msg) {
			if (msg.action == 'movies') {
				var query_args = {
					"apikey": localStorage.getItem('settings_rotten_api_key')
				};
				jQuery.extend(query_args, msg.query_args);
				$.get("http://api.rottentomatoes.com/api/public/v1.0/movies.json", query_args, function(jsonReturn) {
					port.postMessage({response: "movies", response_data: jsonReturn});
				}, "json");
			}
			else if (msg.action == 'load_settings') {
				port.postMessage({response: 'load_settings', response_data: {
						meter_shows_whos_score: parseInt(localStorage.getItem("settings_meter_shows_whos_score")),
						rotten_api_key: localStorage.getItem("settings_rotten_api_key")
					}
				});
			}
		});
	}
});
