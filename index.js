var _ = require('underscore'),
    Chrome = require('chrome-remote-interface'),
    colors = require('colors'),
    Promise = require('bluebird'),
    sonos = require('sonos'),
    google = require('googleapis'),
    youtube = google.youtube('v3'),

    argv = require('minimist')(process.argv.slice(2), {
      default: {
        pollInterval: 1000,
        fallbackVideo: 'QH2-TGUlwu4'
      }
    }),

    info, warn,
    chrome, device, currentTrack;

Promise.promisifyAll(sonos.Sonos.prototype);

// Utils

function log (color /*, ...args */) {
  var args = _.tail(arguments),
      colored = _.map(args, function (arg) {
        return _.isString(arg) ? arg[color] : arg;
      });

  console.log.apply(console, colored);
}

info = log.bind(this, 'green');
debug = log.bind(this, 'yellow');
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
// Points global `device` var to master device.
function getFirstDevice () {
  var dfd = Promise.defer();

  info('Searching for your Sonos system...');

  sonos.search(function (instance) {
    instance.deviceDescription(function (err, desc) {
      debug('Sonos device found:', desc.friendlyName);

      instance.currentTrack(function (err, track) {
        if (!isNaN(track.duration)) {
          device = instance;
          info(desc.friendlyName, 'is the master device.');
          dfd.resolve(device);
        }
      });
    });
  });

  return dfd.promise;
}

function youtubeSearchAsync (term) {
  var params = {
        key: argv.key,
        part: 'snippet',
        q: term
      },
      dfd = Promise.defer();

  youtube.search.list(params, function (err, resp) {
    dfd.resolve(!err && resp && resp.items && resp.items[0]);
  });

  return dfd.promise;
}

// Find Chrome instance launched in remote debugger mode, set it up to take
// navigation commands. Resolves when ready with instance.
// Points global `chrome` var to instance.
function findChrome () {
  var dfd = Promise.defer();

  info('Finding Chrome...');

  Chrome(function (instance) {
    chrome = instance;
    chrome.Network.enable();
    chrome.Page.enable();
    chrome.once('ready', function () {
      info('Chrome found!');
      dfd.resolve(chrome);
    });
  });

  return dfd.promise;
}

function playYouTubeVideo () {
  var term = currentTrack.artist + ' - ' + currentTrack.title;

  youtubeSearchAsync(term)
    .then(function (result) {
      var videoId = result && result.id && result.id.videoId;

      if (!videoId) {
        warn('Could not find YouTube video for', term);
        info('Playing fallback video.');
        return argv.fallbackVideo;
      }

      return videoId;
    })
    .then(function (videoId) {
      chrome.Page.navigate({
        'url': 'https://www.youtube.com/watch?v=' + videoId
      });
    });
}

function checkCurrentTrack () {
  //debug('Polling current track...');

  return device.currentTrackAsync()
    .then(function (track) {
      if (!track) {
        return warn('Could not find current track!');
      }

      // Still same track.
      if (currentTrack && track.title === currentTrack.title) {
        return;
      }

      info('New track!', track.title);

      // New track.
      currentTrack = track;
      playYouTubeVideo();
    });
}

function startTrackPoller () {
  info('Starting track poller...');

  checkCurrentTrack();
  setInterval(checkCurrentTrack, argv.pollInterval);
}

// Gogogogogogo

findChrome()
.then(getFirstDevice)
.then(startTrackPoller)
.catch(function (e) {
  warn('Ah crap something broke:');
  throw e;
});
