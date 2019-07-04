/**
 * Created by chenzhuokai on 16/6/2.
 */
(function () {
  'use strict'
  const fs = require('fs-extra')
  const path = require('path')
  const Xray = require('x-ray')
  const xray = Xray()

  const emojiListUrl = [
    'https://ark.xinshu.me/pages/unicode/full-emoji-list.html',
    'https://ark.xinshu.me/pages/unicode/full-emoji-modifiers.html'
    // Original URL
    // http://unicode.org/emoji/charts/full-emoji-list.html,
    // http://unicode.org/emoji/charts/full-emoji-modifiers.html
  ]

  console.log('Fetching emoji list from', emojiListUrl)
  console.log('--------')

  const xrayConfig = {
    no: 'td:nth-child(1)',
    name: 'td:nth-child(16)',
    unicode: 'td:nth-child(2)',
    image: {
      apple: 'td:nth-child(4):not([colspan]) img@src',
      google: 'td:nth-child(5):not([colspan]) img@src',
      facebook: 'td:nth-child(6):not([colspan]) img@src',
      windows: 'td:nth-child(7):not([colspan]) img@src',
      twitter: 'td:nth-child(8):not([colspan]) img@src',
      joyPixels: 'td:nth-child(9):not([colspan]) img@src',
      samsung: 'td:nth-child(10):not([colspan]) img@src'
    }
  }

  const selector = 'table[border] tr:nth-child(n+1)'
  Promise.all(emojiListUrl.map(url => fetch(url, selector, [xrayConfig]))).then(results => {
    results = results[0].concat(results[1])
    console.log('Emoji list fetched, Emoji total count', results.length)
    console.log('--------')

    // exclude thead
    results = results
      .filter(emoji => {
        return !!emoji.unicode || !/^U/i.test(emoji.unicode)
      })
      .filter(emoji => !!emoji.image.apple) // only apple has made

    // write image string to file
    try {
      fs.emptyDirSync(path.join(__dirname, 'images'))
      console.log('Writing images')
      console.log('--------')
      fs.outputJsonSync(__dirname + '/emoji.json', results.map((i, index) => {
        return {
          no: index + 1,
          unicode: i.unicode,
          name: i.name
        }
      }))

      results.forEach(function (emoji) {
        let unicode = emoji.unicode
          .replace(/u\+/ig, '')
          .replace(/\s/g, '-')
          .replace(/^00/, '') // remove heading 00
          .replace(/fe0f-20e3/ig, '20e3') // fix keycap filename
          .toLocaleLowerCase()

        Object.keys(xrayConfig.image).forEach(function (type) {
          if (!emoji.image[type]) {
            return
          }
          const buffer = decodeBase64Image(emoji.image[type])
          type = type.replace(/([A-Z])/g, '-$1').toLowerCase()
          fs.outputFileSync(path.join(__dirname, 'images', type, unicode + '.png'), buffer)
        })
      })
    } catch (e) {
      console.error(e)
    }

    console.log('Finished')
    process.exit()
  })

  function decodeBase64Image(dataString) {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    let response

    if (matches.length !== 3) {
      return new Error('Invalid input string')
    }

    response = new Buffer(matches[2], 'base64')

    return response
  }

  function fetch(url, selector, config) {
    return new Promise((resolve, reject) => {
      xray(url, selector, config)((err, results) => {
        if (err) {
          return reject(err)
        }
        resolve(results)
      })
    })
  }
})()
