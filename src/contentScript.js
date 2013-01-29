var imdb_version = "2012-01-01";
var settings = {};
var port = chrome.extension.connect({name: "content-background"});


port.onMessage.addListener(function(msg) {
	if (msg.response == 'movies') {
		var rottentomato_response = msg.response_data;
		if (rottentomato_response.total > 0) {
			/* Let's try to figure out if we have better result when we're looping and trying to figure out right movie id */
			var rottentomato_movie = null;
			$(rottentomato_response.movies).each(function(index, movie_item) {
				if (typeof movie_item.alternate_ids != 'undefined' && typeof movie_item.alternate_ids.imdb != 'undefined') {
					if (window.location.pathname.match(new RegExp(movie_item.alternate_ids.imdb))) {
						rottentomato_movie = movie_item;
					}
				}
			});
			if (!rottentomato_movie) {
				rottentomato_movie = rottentomato_response.movies[0];
			}
			
			var movie_total_score = 0;
			var parties_rated = 0;
			var is_rated = false;
			if (rottentomato_movie.ratings.critics_score > 0) {
				movie_total_score += rottentomato_movie.ratings.critics_score;
				++parties_rated;
				is_rated = true;
			}
			
			if (rottentomato_movie.ratings.audience_score > 0) {
				movie_total_score += rottentomato_movie.ratings.audience_score;
				++parties_rated;
				is_rated = true;
			}
			
			var movie_avg_score;
			if (is_rated) {
				movie_avg_score = movie_total_score / parties_rated;
			}
			else {
				movie_avg_score = 0;
			}
			

			
			var movie_info = {
				avg_score: movie_avg_score,
				critics_score: rottentomato_movie.ratings.critics_score,
				audience_score: rottentomato_movie.ratings.audience_score,
				link: rottentomato_movie.links.alternate
			};
			
			generateHtml(movie_info);
		}
	}
	else if (msg.response == 'load_settings') {
		settings = msg.response_data;
		runExtension();
	}
});

function generateHtml(movie_info) {
	if (!settings.meter_shows_whos_score) {
		settings.meter_shows_whos_score = OPTIONS_METER_AVERAGE; 
	}
	var meter_score = movie_info.avg_score;
	switch (settings.meter_shows_whos_score) {
		case OPTIONS_METER_CRITIC:
			meter_score = movie_info.critics_score;
			break;
		case OPTIONS_METER_SHEEPS:
			meter_score = movie_info.audience_score;
			break;
		case OPTIONS_METER_AVERAGE:
			break;
	};
	
	movie_info.is_rotten = true;
	if (meter_score < 50) {
		movie_info.is_rotten = true;
	}
	else {
		movie_info.is_rotten = false;
	}
	
	
	switch (imdb_version) {
		case '2012-01-01':
			var added_html = '' + 
			'<div class="general">' +
				'<div class="info stars">' +
					'<h5>Rotten Rating:</h5>' +
					'<div id="rotten_box_outer"><div id="rotten_box" class="' + (movie_info.is_rotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + meter_score + '%;"></div></div></div></div>' +
					'<div class="starbar-meta"><b>' + (movie_info.critics_score >= 0 ? movie_info.critics_score : 'NA') + '/' + (movie_info.audience_score >= 0 ? movie_info.audience_score : 'NA') + '</b>&nbsp;&nbsp;<a href="' + movie_info.link + '" class="tn15more" target="_blank">To rotten</a>&nbsp;»</div>' +
				'</div>' +
			'</div>';
			$('#tn15rating').append(added_html);
			break;
		case '2012-10-03':
			var added_html = '<div class="star-box-rating-widget">' +
				'<span class="star-box-rating-label">Rotten:</span>' +
				'<div id="rotten_box_outer_2012-10-03" title="Critics rated this ' + ( movie_info.critics_score >= 0 ? movie_info.critics_score : 'NA') + '%, users rated this ' + (movie_info.audience_score >= 0 ? movie_info.audience_score : 'NA') + '%">' +
				'<div id="rotten_box_2012-10-03" class="' + (movie_info.is_rotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + meter_score + '%;"></div></div></div>' +
				'<span class="rating-rating" style="float: left; width: 85px; margin-left: 5px; text-align: left;"><span class="value">' + ( movie_info.critics_score >= 0 ? movie_info.critics_score : 'NA') + '%</span><span class="grey">/</span><span class="grey">' + (movie_info.audience_score >= 0 ? movie_info.audience_score : 'NA') + '%</span></span>&nbsp;' +
				'</div>' + 
			'</div>';
			$('#overview-top DIV.star-box-details').before(added_html);
			break;
	};
	
	
	
}



function detectVersion() {
	if ($('#title-overview-widget-layout').length) {
		imdb_version = "2012-10-03";
	}
}

function parseTitle() {
	var $header;
	switch (imdb_version) {
		case '2012-01-01':
			$header = $('#tn15title h1');
			break;
		case '2012-10-03':
		default:
			$header = $('div#maindetails_center_top h1.header[itemprop="name"]');
	};
	var header_text = $header.clone().children().remove().end().text();
	var movie_name = header_text.replace(/^\s+|\s+$/g, '');
	var movie_year = null;

	$header.find('span').each(function(index, tag_span) {
		var yearstring = $(tag_span).find('a').text();
		var yearstring_cleaned = yearstring.replace(/^\s+|\s+$/g, '') ;
		var yearmatch = yearstring_cleaned.match(/((1|2)[0-9]{3})/);
		if (yearmatch) {
			movie_year = yearmatch[0];
		}
	});

	var full_movie_name = movie_name;

	if (movie_year) {
		full_movie_name = full_movie_name + " " + movie_year;
	}
	var movie = {
		name: movie_name,
		year: movie_year,
		full_name: full_movie_name
	};
	return movie;
}

function runExtension() {
	detectVersion();
	var movie = parseTitle();
	var query_args = {
			"q": movie.full_name,
			"page_limi": 1,
			"page": 1
	};
	if (movie.full_name) {
		port.postMessage({action: 'movies', query_args: query_args});
	}
}

port.postMessage({action: 'load_settings'});