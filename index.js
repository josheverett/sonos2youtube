var _ = require('underscore'),
    Chrome = require('chrome-remote-interface'),
    colors = require('colors'),
    Promise = require('bluebird'),
    sonos = require('sonos'),
    youtubeSearch = require('youtube-search'),

    searchOpts = { maxResults: 1, startIndex: 1 },

    info, warn,
    chrome, device;

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
      info('Sonos device found:', desc.friendlyName);

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

// youtube-search doesn't like promisification. :|
function youtubeSearchAsync (term) {
  var dfd = Promise.defer();

  youtubeSearch(term, searchOpts, function (err, results) {
    dfd.resolve(!err && results && results[0]);
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

// Gogogogogogo

findChrome()
.then(getFirstDevice)
.then(invoker('currentTrackAsync'))
.then(function (track) {
  console.log(track);
})
.then(function () {
  chrome.Page.navigate({ 'url': 'https://github.com' });
  setTimeout(function () {
    chrome.Page.navigate({ 'url': 'https://google.com' });
  }, 3000);
})
.then(youtubeSearchAsync.bind(this, "Get jiggy with it"))
.then(function (ytResult) {
  debug('ytResult:', ytResult);
})
.catch(function (e) {
  warn('Ah crap something broke:');
  throw e;
});
