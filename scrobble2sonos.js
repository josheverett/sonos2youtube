var _ = require('underscore'),
    colors = require('colors'),
    Promise = require('bluebird'),
    sonos = require('sonos'),

    info, warn;

Promise.promisifyAll(sonos.Sonos.prototype);

// Utils

function log (color /*, ...args */) {
  var strings = _.tail(arguments),
      colored = _.map(strings, function (str) {
        return str[color];
      });

  console.log.apply(console, colored);
}

info = log.bind(this, 'green');
warn = log.bind(this, 'red');

function invoker (method /*, ...args */) {
  var args = _.tail(arguments);

  return function (obj) {
    return obj[method].apply(obj, args);
  }
}

// Will show all devices but only resolve the first one that is actually
// playing a track. This sonos node lib does not handle multiple devices
// very well.
function getFirstDevice () {
  var dfd = Promise.defer();

  sonos.search(function (device) {
    device.deviceDescription(function (err, desc) {
      info('Sonos device found:', desc.friendlyName);

      device.currentTrack(function (err, track) {
        if (!isNaN(track.duration)) {
          info(desc.friendlyName, 'is the master device.');
          dfd.resolve(device);
        }
      });
    });
  });

  return dfd.promise;
}

// Gogogogogogo

info('Searching for your Sonos system...');

getFirstDevice()
.then(invoker('currentTrackAsync'))
// .then(invoker('getZoneInfoAsync'))
.then(function (track) {
  console.log(track);
})
.catch(function (e) {
  warn('Ah crap something broke:');
  throw e;
});
