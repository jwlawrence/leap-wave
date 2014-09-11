var events = require('events');
var eventEmitter = new events.EventEmitter();
var Cylon = require('cylon');

Cylon.robot({
	connection: {
		name: 'leapmotion',
		adaptor: 'leapmotion',
		port: '127.0.0.1:6437'
	},

	device: {
		name: 'leapmotion',
		driver: 'leapmotion'
	},

	work: function(my) {
		var paused;
		var previousFrame;
		var previousTimestamp;
		var direction;
		var previousDirection;
		var waveEvents = [];

		eventEmitter.on('wave', sayHi);

		my.leapmotion.on('frame', function(frame) {
			if ( paused ) {
				return;
			}

			var currentTimestamp = Math.round(frame.timestamp / 1000);

			if (frame.hands.length > 0) {
				for (var i = 0; i < frame.hands.length; i++) {
					var hand = frame.hands[i];

					// Determine if user is waving
					if (previousFrame) {
						var tolerance = 2;
						var translation = hand.translation(previousFrame)[0];
						var translationAbs = Math.abs(translation);

						if (translationAbs > tolerance) {
							// User has waved in one direction
							if ( previousDirection !== direction ) {
								waveEvents.push(currentTimestamp);
								previousDirection = direction;
							}
							direction = translation > 0 ? 'right' : 'left';
						}
					}
				}
			}

			if (!previousTimestamp) {
				previousTimestamp = currentTimestamp;
			}

			if ( currentTimestamp >= previousTimestamp + 1000 ) {
				if ( waveEvents.length >= 3 ) {
					eventEmitter.emit('wave');
				}
				waveEvents = [];
				previousTimestamp = currentTimestamp;
			}

			previousFrame = frame;
		});

		function sayHi() {
			paused = true;
			console.log('hi there!');

			setTimeout(function() {
				paused = false;
			}, 2000);
		}

	}
}).start();