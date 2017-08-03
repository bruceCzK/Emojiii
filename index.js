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
  const emojiListUrl = 'https://ark.xinshu.me/pages/unicode/';

  console.log('Fetching emoji list from', emojiListUrl);
  console.log('--------');

  const xrayConfig = {
    no: 'td:nth-child(1)',
    name: 'td:nth-child(16)',
    unicode: 'td:nth-child(2)',
    image: {
      apple: 'td:nth-child(4):not([colspan]) img@src',
      google: 'td:nth-child(5):not([colspan]) img@src',
      twitter: 'td:nth-child(6):not([colspan]) img@src',
      emojiOne: 'td:nth-child(7):not([colspan]) img@src',
      facebook: 'td:nth-child(8):not([colspan]) img@src',
      messenger: 'td:nth-child(9):not([colspan]) img@src',
      samsung: 'td:nth-child(10):not([colspan]) img@src',
      windows: 'td:nth-child(11):not([colspan]) img@src'
    }
  };

  xray(emojiListUrl, 'table[border] tr:nth-child(n+1)', [xrayConfig])(function (error, emojiList) {
    if (error) {
      console.error(error.message);
      return;
    }
    console.log('Emoji list fetched, Emoji total count', emojiList.length);
    console.log('--------');

    // exclude thead
    emojiList = emojiList.filter(function (emoji) {
      return !!emoji.unicode || !/^U/i.test(emoji.unicode);
    });

    // write image string to file
    try {
      fs.emptyDirSync(path.join(__dirname, 'images'));
      console.log('Writing images');
      console.log('--------');
      fs.outputJsonSync(__dirname + '/emoji.json', emojiList.map(i => {
        return {
          no: i.no,
          unicode: i.unicode,
          name: i.name
        }
      }));

      emojiList.forEach(function (emoji) {
        let unicode = emoji.unicode
          .replace(/u\+/ig, '')
          .replace(/\s/g, '-')
          .replace(/^00/, '') // remove heading 00
          .replace(/fe0f-20e3/ig, '20e3') // fix keycap filename
          .toLocaleLowerCase();

        Object.keys(xrayConfig.image).forEach(function (type) {
          if (!emoji.image[type]) {
            return;
          }
          const buffer = decodeBase64Image(emoji.image[type]);
          type = type.replace(/([A-Z])/g, '-$1').toLowerCase();
          fs.outputFileSync(path.join(__dirname, 'images', type, unicode + '.png'), buffer);
        });
      });
    } catch (e) {
      console.error(e);
    }

    console.log('Finished');
    process.exit();
  });

  function decodeBase64Image(dataString) {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response;

    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }

    response = new Buffer(matches[2], 'base64');

    return response;
  }
})();
