var Twit = require( 'twit' ),
	config = require( './config/config' ),
	rhyme = require( 'rhyme' ),
	fs = require( 'fs' ),
	_ = require( 'underscore' );

var lines = fs.readFileSync( 'data/texts.txt' ).toString().split( '\n' );

process.env.openshift = process.env.openshift || {};

var T = new Twit({
	consumer_key: process.env.openshift.CONSUMER_KEY || config.consumer_key || '',
	consumer_secret: process.env.openshift.CONSUMER_SECRET || config.consumer_secret || '',
	access_token: process.env.openshift.ACCESS_TOKEN || config.access_token || '',
	access_token_secret: process.env.openshift.ACCESS_TOKEN_SECRET || config.access_token_secret || ''
});

var getLineWithWord = function ( words ) {

	potentialLines = [];
	potentialWords = [];
	_.each( words, function ( word ) {
		if ( word.length > 0 ) {
			_.each( lines, function ( line ) {
				_.each( line.toLowerCase().split( ' ' ), function ( lineWord ) {
					if ( word.toLowerCase().replace(/\W/g, '') === lineWord.replace(/\W/g, '') ) {
						potentialWords.push( word );
						potentialLines.push( line );
					}
				});
			});
		}
	});

	var rando = Math.round( Math.random() * ( potentialLines.length - 1 ) )
	var line = potentialLines[rando];
	var word = potentialWords[rando];
	return { line: line, word: word };

};


var getSampleCharacters = function ( params ) {

	if ( params.line && params.word ) {
		// console.log( params );
		var length = 100;
		if ( params.line.length > length ) {

			var words = params.line.toLowerCase().split( ' ' );
			var startWord = '', index = 0;

			_.each( words, function ( word, i ) {

				if ( word.replace(/\W/g, '' ) === params.word.toLowerCase().replace(/\W/g, '') ) {
					startWord = word;
					index = i;
				}

			});

			var addWord = function ( shorter, j ) {
				var word = words[j];
				if ( !_.isString( word ) || ( shorter.length + word.length > length ) ) {
					return shorter;
				} else {
					better = shorter + ' ' + word;
					j++;
					return addWord( better, j );
				}
			}
			return addWord( '', index );

		} else {
			return params.line;
		}
	} else {
		return 'Alas, I have no rhymes for that.';
	}

};




rhyme( function ( r ) {
	// var input = 'Is this even on?';
	// var inputArray = input.split( ' ' );
	// var rhymes = []
	// _.each( inputArray, function ( word ) {
	// 	if ( word.length > 3 ) {
	// 		rhymes.push( r.rhyme( word.replace(/\W/g, '' ) ) );
	// 		rhymes.push( word );
	// 	}
	// });
	// var line = getLineWithWord( _.flatten( rhymes ) );
	// var tweet = getSampleCharacters( line );
	// console.log( tweet );

	var stream = T.stream( 'user', { replies: true } );

	stream.on( 'tweet', function ( tweet ) {
		// console.log( tweet );
		var handle = tweet.user.screen_name;
		if ( handle !== 'kingofthatalso' ) {
			var id = tweet.id_str;
			var text = tweet.text;
			var inputArray = text.split( ' ' );
			var rhymes = [];
			_.each( inputArray, function ( word ) {
				if ( word.length > 3 ) {
					rhymes.push( r.rhyme( word.replace(/\W/g, '' ) ) );
					rhymes.push( word );
				}
			});
			var line = getLineWithWord( _.flatten( rhymes ) );
			var tweet = getSampleCharacters( line );
			tweet = '@' + handle + ' ' + tweet;
			var params = { status: tweet, in_reply_to_status_id: id };
			T.post('statuses/update', params, function (err, data, response) {
				// console.log(data)
			});
		}

	});

});
