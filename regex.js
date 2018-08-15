/**
 * Created by chenzhuokai on 16/6/3.
 */
(function () {
  'use strict';
  const fs = require('fs-extra');
  const _ = require('lodash');

  let emojiList = fs.readJsonSync(__dirname + '/emoji.json');
  const fromCharCode = String.fromCharCode;
  const unicodeToJsEscape = require('unicode-escape');

  let unicodeList = emojiList.map(function (emoji) {
    emoji.converted = emoji.unicode.replace(/U\+/g, '').replace(/\s/g, '-');
    return emoji;
  }).filter(emoji => {
    return /U\+/.test(emoji.unicode)
  });

  unicodeList = _.sortBy(unicodeList, function (unicode) {
    return -(unicodeToJsEscape(unicode.converted).length);
  });

  unicodeList = unicodeList.map(function (unicode) {
    unicode.converted = unicodeToJsEscape(unicode.converted.split('-').map(fromCodePoint).join(''));
    return unicode;
  });

  console.log('Exporting regex-es5.txt');
  let regexEs5Txt = unicodeList.map((u)=> {
    return u.converted.replace('\\ufe0f\\u20e3', '\\ufe0f?\\u20e3');
  }).join('|')
  fs.outputFileSync(__dirname + '/regex-es5.txt', regexEs5Txt);

  console.log('Exporting regex-es6.txt');
  fs.outputFileSync(__dirname + '/regex-es6.txt', unicodeList.map((u)=> {
    return u.unicode.replace(/\s/g, '').replace(/U\+([0-9A-F]+)/ig, '\\u{$1}').toLocaleLowerCase();
  }).join('|'));

  console.log('Exporting regex-python.txt');
  fs.outputFileSync(__dirname + '/regex-python.txt', unicodeList.map((u)=> {
    let unicode = u.unicode.replace(/\s/g, '');
    return unicode.split('U+').map(char => {
      if (!char) {
        return ''
      }
      return '\\U' + _.padStart(char, 8, '0')
    }).join('')
  }).join('|'));

  fs.outputJson(__dirname + '/unicode.json', unicodeList);

  let jsFile = fs.readFileSync('./emoji-parser.js.template').toString()
  jsFile = jsFile.replace('<% regex-es5 %>', regexEs5Txt)
  jsFile = `/* Generated at ${new Date()} */\n` + jsFile
  fs.writeFileSync('./emoji-parser.js', jsFile)

  function fromCodePoint(codepoint) {
    let code = typeof codepoint === 'string' ?
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
