var $header = $('#tn15title h1');

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
			
			var is_rotten = true;
			if (movie_avg_score < 50) {
				is_rotten = true;
			}
			else {
				is_rotten = false;
			}
			var added_html = '' + 
			'<div class="general">' +
				'<div class="info stars">' +
					'<h5>Rotten Rating:</h5>' +
					'<div id="rotten_box_outer"><div id="rotten_box" class="' + (is_rotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + movie_avg_score + '%;"></div></div></div></div>' +
					'<div class="starbar-meta"><b>' + (rottentomato_movie.ratings.critics_score >= 0 ? rottentomato_movie.ratings.critics_score : 'NA') + '/' + ( rottentomato_movie.ratings.audience_score >= 0 ? rottentomato_movie.ratings.audience_score : 'NA') + '</b>&nbsp;&nbsp;<a href="' + rottentomato_movie.links.alternate + '" class="tn15more" target="_blank">To rotten</a>&nbsp;»</div>' +
				'</div>' +
			'</div>';
			$('#tn15rating').append(added_html);
		}
	}
});


var header_text = $header.clone().children().remove().end().text();
var movie_name = header_text.replace(/^\s+|\s+$/g, '');

var movie_year;

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

var query_args = {
		"q": full_movie_name,
		"page_limi": 1,
		"page": 1
};

if (full_movie_name) {
	port.postMessage({action: 'movies', query_args: query_args});
}
