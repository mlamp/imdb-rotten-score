const apiUrl = 'http://nas:8080/api/';

chrome.extension.onConnect.addListener(function (port) {
    if (port.name == 'content-background') {
        port.onMessage.addListener(function (msg) {
            if (msg.action == 'getMovieInfo') {
                const movie = msg.movie;
                if (false && movie.imdbId) {
                    jQuery.get(apiUrl + 'imdbId', {imdbId: movie.imdbId}, function (jsonReturn) {
                        port.postMessage({response: 'movieResponse', responseData: jsonReturn});
                    }, 'json');
                } else if (movie.imdbType === 'movie') {
                    jQuery.get(apiUrl + 'movie', {name: movie.name, year: movie.year}, function (jsonReturn) {
                        port.postMessage({response: 'movieResponse', responseData: jsonReturn});
                    }, 'json');
                } else if (movie.imdbType == 'tv') {
                    jQuery.get(apiUrl + 'tv', {name: movie.name, year: movie.year}, function (jsonReturn) {
                        port.postMessage({response: 'movieResponse', responseData: jsonReturn});
                    }, 'json');
                }
            } else if (msg.action == 'loadSettings') {
                port.postMessage({
                    response: 'loadSettings', responseData: {
                        meter_shows_whos_score: parseInt(localStorage.getItem('settings_meter_shows_whos_score'))
                    }
                });
            }
        });
    }
});
