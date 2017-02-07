let imdbVersion = "2012-01-01";
let settings = {};
const port = chrome.extension.connect({name: "content-background"});


port.onMessage.addListener(function(msg) {
	if (msg.response == 'movieResponse') {
		if (msg.responseData) {
			let movieTotalScore = 0;
			let partiesRated = 0;
			let isRated = false;
			if (msg.responseData.rottenScores.criticsScore > 0) {
				movieTotalScore += msg.responseData.rottenScores.criticsScore;
				++partiesRated;
				isRated = true;
			}

			if (msg.responseData.rottenScores.audienceScore > 0) {
				movieTotalScore += msg.responseData.rottenScores.audienceScore;
				++partiesRated;
				isRated = true;
			}

			let movieAvgScore;
			if (isRated) {
				movieAvgScore = movieTotalScore / partiesRated;
			}
			else {
				movieAvgScore = 0;
			}

			const movieInfo = {
				avgScore: movieAvgScore,
				criticsScore: msg.responseData.rottenScores.criticsScore,
				audienceScore: msg.responseData.rottenScores.audienceScore,
				link: msg.responseData.rottenLink,
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
	let meter_score = movieInfo.avgScore;
	switch (settings.meter_shows_whos_score) {
		case OPTIONS_METER_CRITIC:
			meter_score = movieInfo.criticsScore;
			break;
		case OPTIONS_METER_SHEEPS:
			meter_score = movieInfo.audienceScore;
			break;
		case OPTIONS_METER_AVERAGE:
			break;
	}
	movieInfo.isRotten = meter_score < 50;

	let addedHtml;
	switch (imdbVersion) {
		case '2012-01-01':
			addedHtml = '' +
			'<div class="general">' +
				'<div class="info stars">' +
					'<h5>Rotten Rating:</h5>' +
					'<div id="rotten_box_outer"><div id="rotten_box" class="' + (movieInfo.isRotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + meter_score + '%;"></div></div></div></div>' +
					'<div class="starbar-meta"><b>' + (movieInfo.criticsScore >= 0 ? movieInfo.criticsScore : 'NA') + '/' + (movieInfo.audienceScore >= 0 ? movieInfo.audienceScore : 'NA') + '</b>&nbsp;&nbsp;<a href="' + movieInfo.link + '" class="tn15more" target="_blank">To rotten</a>&nbsp;»</div>' +
				'</div>' +
			'</div>';
			jQuery('#tn15rating').append(addedHtml);
			break;
		case '2012-10-03':
			addedHtml = '<div class="star-box-rating-widget">' +
				'<span class="star-box-rating-label">Rotten:</span>' +
				'<div id="rotten_box_outer_2012-10-03" title="Critics rated this ' + ( movieInfo.criticsScore >= 0 ? movieInfo.criticsScore : 'NA') + '%, users rated this ' + (movieInfo.audienceScore >= 0 ? movieInfo.audienceScore : 'NA') + '%">' +
				'<div id="rotten_box_2012-10-03" class="' + (movieInfo.isRotten ? 'rotten' : '') + '"><div class="background"><div class="foreground" style="width: ' + meter_score + '%;"></div></div></div>' +
				'<span class="rating-rating" style="float: left; width: 85px; margin-left: 5px; text-align: left;"><span class="value">' + ( movieInfo.criticsScore >= 0 ? movieInfo.criticsScore : 'NA') + '%</span><span class="grey">/</span><span class="grey">' + (movieInfo.audienceScore >= 0 ? movieInfo.audienceScore : 'NA') + '%</span></span>&nbsp;' +
				'</div>' +
			'</div>';
			jQuery('#overview-top').find('DIV.star-box-details').before(addedHtml);
			break;
		case '2016-12-30':
			const $titleBarWrapper = jQuery('#title-overview-widget > div.vital > div.title_block > div.title_bar_wrapper');
			const $ratingsWrapper = $titleBarWrapper.find('div.ratings_wrapper');
            $ratingsWrapper.wrap('<div class="rottenScoreWrapper" style="float: right"></div>');
            $ratingsWrapper.wrap('<div class="rottenScoreWrapperImdbScore"></div>');

            addedHtml = `
<div class="rottenScoreWrapperRottenScore">
    <div class="ratings_wrapper">
        <div class="imdbRating${movieInfo.isRotten ? ' rotten' : ''}" id="rottenScoreRottenScore">
            <div class="ratingValue">
                <strong title="Critics rated this ${movieInfo.criticsScore >= 0 ? movieInfo.criticsScore : 'NA'}%, users rated this ${movieInfo.audienceScore >= 0 ? movieInfo.audienceScore : 'NA'}%"><span
                        itemprop="ratingValue">${movieInfo.criticsScore >= 0 ? movieInfo.criticsScore : 'NA'}</span></strong><span
                    class="grey">/</span><span class="grey" itemprop="bestRating">${movieInfo.audienceScore >= 0 ? movieInfo.audienceScore : 'NA'}</span></div>
        </div>
    </div>
</div>`;
            $titleBarWrapper.find('div.rottenScoreWrapperImdbScore').append(addedHtml);
			break;
	}
}



function detectVersion() {
	if (jQuery('div.title_block div.title_bar_wrapper div.ratings_wrapper').length) {
		imdbVersion = "2016-12-30";
	} else if (jQuery('#title-overview-widget').length) {
        imdbVersion = "2012-10-03";
	}
}

function parseTitle() {
	let $header;
	let imdbType = 'movie';
	switch (imdbVersion) {
		case '2012-01-01':
			$header = jQuery('#tn15title').find('h1');
			break;
		case '2016-12-30':
			$header = jQuery('#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > h1[itemprop="name"]');
			break;
		default:
			$header = jQuery('h1.header span[itemprop="name"]');
	}
    const headerText = $header.clone().children().remove().end().text();
    const movieName = headerText.replace(/^\s+|\s+$/g, '');
    let movieYear;
	$header.find('span').each(function(index, tagSpan) {
        const yearString = jQuery(tagSpan).find('a').text();
        const yearStringCleaned = yearString.replace(/^\s+|\s+$/g, '') ;
        const yearMatch = yearStringCleaned.match(/((1|2)[0-9]{3})/);
		if (yearMatch) {
			movieYear = yearMatch[0];
		}
	});
	if (!movieYear) {
        const titleText = jQuery('title').text();
        const yearMatch = titleText.match(/\(TV Series ((1|2)[0-9]{3})–(((1|2)[0-9]{3})|\s)?\) \- IMDb$/);
        if (yearMatch !== null) {
            imdbType = 'tv';
        	movieYear = yearMatch[1];
		}
	}

	let parseImdbIdParts = /\/(tt[0-9]{2,10})\//.exec(window.location.pathname);

	let imdbId;
	if (parseImdbIdParts) {
        imdbId = parseImdbIdParts[1];
	}
	return {
        imdbType,
		imdbId: imdbId,
		name: movieName,
		year: movieYear,
	};
}

function runExtension() {

	detectVersion();
	const movie = parseTitle();
    port.postMessage({action: 'getMovieInfo', movie: movie});
}

port.postMessage({action: 'loadSettings'});