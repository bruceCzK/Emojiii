/**
 * Created by chenzhuokai on 16/6/2.
 */
(function () {
  'use strict';
  const fs = require('fs-extra');
  const path = require('path');
  const Xray = require('x-ray');
  const xray = Xray();

  // Original URL http://unicode.org/emoji/charts/full-emoji-list.html
  // For users in china mainland, use https://ark.xinshu.me/pages/unicode/
  var emojiListUrl = 'https://ark.xinshu.me/pages/unicode/';

  console.log('Fetching emoji list from', emojiListUrl);
  console.log('--------');

  var xrayConfig = {
    unicode: 'td:nth-child(2)',
    image: {
      apple: 'td:nth-child(5) img@src',
      google: 'td:nth-child(6) img@src',
      twitter: 'td:nth-child(7) img@src',
      emojiOne: 'td:nth-child(8) img@src',
      facebook: 'td:nth-child(9) img@src',
      windows: 'td:nth-child(10) img@src',
      samsung: 'td:nth-child(11) img@src'
    },
    name: 'td:nth-child(16)',
    date: 'td:nth-child(17)'
  };

  xray(emojiListUrl, 'table tr:nth-child(n+1)', [xrayConfig])(function (error, emojiList) {
    console.log('Emoji list fetched, length', emojiList.length);
    console.log('--------');

    // exclude thead
    emojiList = emojiList.filter(function (emoji) {
      return !!emoji.unicode;
    });

    // write image string to file
    try {
      fs.emptyDirSync(path.join(__dirname, 'images'));
      console.log('Writing images');
      console.log('--------');
      fs.outputJson(__dirname + '/emoji.json', emojiList.map((i) => {
        return {
          unicode: i.unicode,
          name: i.name,
          date: i.date
        }
      }));
      emojiList.forEach(function (emoji) {
        var unicode = emoji.unicode.replace(/u\+/ig, '').replace(/\s/g, '-').toLocaleLowerCase();
        Object.keys(xrayConfig.image).forEach(function (type) {
          if (!emoji.image[type]) {
            return;
          }
          var buffer = decodeBase64Image(emoji.image[type]);
          fs.outputFile(path.join(__dirname, 'images', type, unicode + '.png'), buffer);
        });
      });
    } catch (e) {
      console.error(e);
    }

    console.log('Finished');
  });

  function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response;

    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }

    response = new Buffer(matches[2], 'base64');

    return response;
  }
})();
