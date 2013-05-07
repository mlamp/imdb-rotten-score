var imdbVersion = "2012-01-01";
var settings = {};
var port = chrome.extension.connect({name: "content-background"});


port.onMessage.addListener(function(msg) {
	if (msg.response == 'movies') {
		var rottentomatoResponse = msg.responseData;
		if (rottentomatoResponse.total > 0) {
			/* Let's try to figure out if we have better result when we're looping and trying to figure out right movie id */
			var rottentomatoMovie = null;
			var isExactMatch = false;
			$(rottentomatoResponse.movies).each(function(index, movieItem) {
				if (typeof movieItem.alternate_ids != 'undefined' && typeof movieItem.alternate_ids.imdb != 'undefined') {
					if (window.location.pathname.match(new RegExp(movieItem.alternate_ids.imdb))) {
						rottentomatoMovie = movieItem;
						isExactMatch = true;
					}
				}
			});
			if (!rottentomatoMovie) {
				rottentomatoMovie = rottentomatoResponse.movies[0];
				isExactMatch = false;
			}
			
			var movieTotalScore = 0;
			var partiesRated = 0;
			var isRated = false;
			if (rottentomatoMovie.ratings.critics_score > 0) {
				movieTotalScore += rottentomatoMovie.ratings.critics_score;
				++partiesRated;
				isRated = true;
			}
			
			if (rottentomatoMovie.ratings.audience_score > 0) {
				movieTotalScore += rottentomatoMovie.ratings.audience_score;
				++partiesRated;
				isRated = true;
			}
			
			var movieAvgScore;
			if (isRated) {
				movieAvgScore = movieTotalScore / partiesRated;
			}
			else {
				movieAvgScore = 0;
			}
			
			var movieInfo = {
				avgScore: movieAvgScore,
				critics_score: rottentomatoMovie.ratings.critics_score,
				audience_score: rottentomatoMovie.ratings.audience_score,
				link: rottentomatoMovie.links.alternate,
				isExactMatch: isExactMatch
			};
			
			generateHtml(movieInfo);
		}
	}
	else if (msg.response == 'loadSettings') {
		settings = msg.responseData;
		runExtension();
	}
});

function generateHtml(movieInfo) {
	if (!settings.meter_shows_whos_score) {
		settings.meter_shows_whos_score = OPTIONS_METER_AVERAGE; 
	}
	var meter_score = movieInfo.avg_score;
	switch (settings.meter_shows_whos_score) {
		case OPTIONS_METER_CRITIC:
			meter_score = movieInfo.critics_score;
			break;
		case OPTIONS_METER_SHEEPS:
			meter_score = movieInfo.audience_score;
			break;
		case OPTIONS_METER_AVERAGE:
			break;
	}
	
	movieInfo.isRotten = meter_score < 50;

	var addedHtml;
	switch (imdbVersion) {
		case '2012-01-01':
			addedHtml = '' +
			'<div class="general">' +
				'<div class="info stars">' +
					'<h5>Rotten Rating:</h5>' +
					'<div id="rotten_box_outer"><div id="rotten_box" class="' + (movieInfo.isRotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + meter_score + '%;"></div></div></div></div>' +
					'<div class="starbar-meta"><b>' + (movieInfo.critics_score >= 0 ? movieInfo.critics_score : 'NA') + '/' + (movieInfo.audience_score >= 0 ? movieInfo.audience_score : 'NA') + '</b>&nbsp;&nbsp;<a href="' + movieInfo.link + '" class="tn15more" target="_blank">To rotten</a>&nbsp;»</div>' +
				'</div>' +
			'</div>';
			jQuery('#tn15rating').append(addedHtml);
			break;
		case '2012-10-03':
			addedHtml = '<div class="star-box-rating-widget">' +
				'<span class="star-box-rating-label">Rotten:</span>' +
				'<div id="rotten_box_outer_2012-10-03" title="Critics rated this ' + ( movieInfo.critics_score >= 0 ? movieInfo.critics_score : 'NA') + '%, users rated this ' + (movieInfo.audience_score >= 0 ? movieInfo.audience_score : 'NA') + '%">' +
				'<div id="rotten_box_2012-10-03" class="' + (movieInfo.isRotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + meter_score + '%;"></div></div></div>' +
				'<span class="rating-rating" style="float: left; width: 85px; margin-left: 5px; text-align: left;"><span class="value">' + ( movieInfo.critics_score >= 0 ? movieInfo.critics_score : 'NA') + '%</span><span class="grey">/</span><span class="grey">' + (movieInfo.audience_score >= 0 ? movieInfo.audience_score : 'NA') + '%</span></span>&nbsp;' +
				'</div>' + 
			'</div>';
			jQuery('#overview-top').find('DIV.star-box-details').before(addedHtml);
			break;
	}
	
	
	
}



function detectVersion() {
	if (jQuery('#title-overview-widget').length) {
		imdbVersion = "2012-10-03";
	}
}

function parseTitle() {
	var $header;
	switch (imdbVersion) {
		case '2012-01-01':
			$header = jQuery('#tn15title').find('h1');
			break;
		//case '2012-10-03':
		default:
			$header = jQuery('h1.header span[itemprop="name"]');
	}
	var headerText = $header.clone().children().remove().end().text();
	var movieName = headerText.replace(/^\s+|\s+$/g, '');
	var movieYear = null;
	$header.find('span').each(function(index, tagSpan) {
		var yearString = jQuery(tagSpan).find('a').text();
		var yearStringCleaned = yearString.replace(/^\s+|\s+$/g, '') ;
		var yearMatch = yearStringCleaned.match(/((1|2)[0-9]{3})/);
		if (yearMatch) {
			movieYear = yearMatch[0];
		}
	});

	var fullMovieName = movieName;

	if (movieYear) {
		fullMovieName = fullMovieName + " " + movieYear;
	}
	return {
		name: movieName,
		year: movieYear,
		fullName: fullMovieName
	};
}

function runExtension() {

	detectVersion();
	var movie = parseTitle();
	var queryArgs = {
			"q": movie.fullName,
			"page_limit": 1,
			"page": 1
	};
	if (movie.fullName) {
		port.postMessage({action: 'movies', queryArgs: queryArgs});
	}
}

port.postMessage({action: 'loadSettings'});