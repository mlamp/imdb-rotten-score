var $header = $('#tn15title h1');

var port = chrome.extension.connect({name: "content-background"});
port.onMessage.addListener(function(msg) {
	if (msg.response == 'movies') {
		var rottentomato_response = msg.response_data;
		console.log(rottentomato_response);
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
			var movie_avg_score = (rottentomato_movie.ratings.critics_score + rottentomato_movie.ratings.audience_score) / 2;
			var is_rotten = true;
			if (movie_avg_score < 50) {
				is_rotten = true;
			}
			else {
				is_rotten = false;
			}
			//console.log(chrome.extension.getURL("icons/rt_lg.png"));
			var added_html = '<div class="rottenscore"><span itemprop="ratingValue" class="meter' + (is_rotten ? ' rotten' : ' fresh') + ' numeric ">' + rottentomato_movie.ratings.critics_score + '/' + rottentomato_movie.ratings.audience_score + '</span></div><br />';
				//<img src="' + chrome.extension.getURL("icons/rt_lg.png") + '" /></td>'
			//+ '<td>' + rottentomato_movie.ratings.critics_score + '/' + rottentomato_movie.ratings.audience_score + '</td></tr></table>';
			added_html = '' + 
			'<div class="general">' +
				'<div class="info stars">' +
					'<h5>Rotten Rating:</h5>' +
					'<div id="rotten_box_outer"><div id="rotten_box" class="' + (is_rotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + movie_avg_score + '%;"></div></div></div></div>' +
					'<div class="starbar-meta"><b>' + rottentomato_movie.ratings.critics_score + '/' + rottentomato_movie.ratings.audience_score + '</b>&nbsp;&nbsp;<a href="' + rottentomato_movie.links.alternate + '" class="tn15more" target="_blank">To rotten</a>&nbsp;»</div>' +
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



//
//$.get("http://api.rottentomatoes.com/api/public/v1.0/movies.json", query_args, function(jsonReturn) {
//	console.log(jsonReturn);
//});