/**
 * Created by chenzhuokai on 16/6/3.
 */
(function () {
  'use strict';
  const fs = require('fs-extra');
  const _ = require('lodash');

  var emojiList = fs.readJsonSync(__dirname + '/emoji.json');
  var fromCharCode = String.fromCharCode;
  var unicodeToJsEscape = require('unicode-escape');

  var unicodeList = emojiList.map(function (emoji) {
    emoji.converted = emoji.unicode.replace(/U\+/g, '').replace(/\s/g, '-');
    return emoji;
  });

  unicodeList = _.sortBy(unicodeList, function (unicode) {
    return -(unicodeToJsEscape(unicode.converted).length);
  });

  unicodeList = unicodeList.map(function (unicode) {
    unicode.converted = unicodeToJsEscape(unicode.converted.split('-').map(fromCodePoint).join(''));
    return unicode;
  });

  fs.outputFile(__dirname + '/regex.txt', unicodeList.map((u)=> {
    return u.converted;
  }).join('|'));

  fs.outputFile(__dirname + '/regex-unicode.txt', unicodeList.map((u)=> {
    return u.unicode.replace(/\s/g, '').replace(/U\+/g, 'U000');
  }).join('|'));

  fs.outputJson(__dirname + '/unicode.json', unicodeList);

  function fromCodePoint(codepoint) {
    var code = typeof codepoint === 'string' ?
      parseInt(codepoint, 16) : codepoint;
    if (code < 0x10000) {
      return fromCharCode(code);
    }
    code -= 0x10000;
    return fromCharCode(
      0xD800 + (code >> 10),
      0xDC00 + (code & 0x3FF)
    );
  }
})();
