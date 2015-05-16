# sonos2youtube

Plays YouTube videos for the current Sonos track in Chrome.

## Usage (OSX)

1. Create a server API key for use with the YouTube API. For more info, see [the relevant Google developer docs.](https://developers.google.com/youtube/registering_an_application)

2. Make sure Chrome is completely shut down.

3. `$ /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222`

4. `$ npm install`

5. `$ node index.js --key=YOUR_API_KEY`

6. Grab a beer.

## Options

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>pollInterval</td>
      <td>How often to check the current track on Sonos, in milliseconds.</td>
      <td>1000</td>
    </tr>
    <tr>
      <td>fallbackVideo</td>
      <td>YouTube ID of the video to play if no results are found.</td>
      <td>QH2-TGUlwu4</td>
    </tr>
  </tbody>
</table>

## Tips

This module is a lot of fun for situations where you're using Sonos as a
jukebox, with lots of people adding music to the queue. Audio and video will
never be perfectly synced -- that's not the goal of this module.

For best results while using this module:

* Log into YouTube with an account that can view age restricted videos.
* Block preroll ads on YouTube.
* Mute your Mac's audio.
* Be intoxicated.

## License

MIT
