# emoji-generator
Use [X-ray](https://github.com/lapwinglabs/x-ray) to get emoji base64 image from [unicode.org](http://unicode.org/emoji/charts/full-emoji-list.html) and save as png

## Emoji Parser Usage
Almost as same as [twemoji](https://github.com/twitter/twemoji)
```
  <sciprt src="https://rawcdn.githack.com/bruceCzK/emoji-generator/master/emoji-parser.js"></script>
  <script>
    twemoji.parse(document.body, function (icon) {
      // You can use other vendor instead of apple
      return 'https://o4itt7tbh.qnssl.com/assets/images/emoji/apple/' + icon + '.png';
    });
  </script>
```

## Generate emoji regexp
```
$ npm install
$ npm start
```

