const fs = require('fs-extra')
const path = require('path')
const Xray = require('x-ray')
const axios = require('axios')
const {PromisePool} = require('@supercharge/promise-pool')
const cliProgress = require('cli-progress')

const xray = Xray()

const emojiListUrl = {
  apple: 'https://www.emojiall.com/zh-hans/image-emoji-platform/apple/hd'
}

main()

async function main() {
  const xrayItemSelector = '.emoji_image_box > .col'
  const xrayConfig = {
    char: '.emoji_font',
    link: 'a[href][download]@href',
    name: 'a.strong.decoration[href][title]@title'
  }

  for (const [brand, url] of Object.entries(emojiListUrl)) {
    console.log('--------')
    console.log('Fetching %s emoji list from %s', brand, url)
    const results = await xray(url, xrayItemSelector, [xrayConfig])
    console.log('Emoji list fetched, Emoji total count', results.length)
    for (const item of results) {
      item.unicode = charToUnicode(item.char)
    }
    const json = results.map((i, idx) => {
      return {
        no: idx + 1,
        name: i.name,
        unicode: i.unicode
      }
    })
    fs.outputJsonSync(path.join(__dirname, 'emoji.json'), json)
    console.log('Json file saved')

    let leftCount = results.length
    let fileCount = 0

    console.log('Fetching images files %d', leftCount)

    const b1 = new cliProgress.SingleBar()
    b1.start(leftCount)

    await PromisePool.for(results).withConcurrency(64).process(async item => {
      const {data: arraybuffer} = await axios.get(item.link, {responseType: 'arraybuffer'})
      const filename = path.basename(item.link)
      const pathname = path.join(__dirname, 'images', brand, filename)
      if (/fe0f-20e3/.test(pathname)) {
        // fix keycap filename
        fileCount++
        await fs.outputFile(pathname.replace('fe0f-20e3', '20e3'), arraybuffer)
      }
      if (/-fe0f\.png$/.test(filename) && filename.split('-').length === 2) {
        // fix fe0f suffix
        fileCount++
        await fs.outputFile(pathname.replace(/-fe0f\.png$/, '.png'), arraybuffer)
      }
      fileCount++
      b1.increment()
      return fs.outputFile(pathname, arraybuffer)
    })

    b1.stop()

    console.log('%d files saved', fileCount)
  }
}

function charToUnicode(char) {
  return [...char].map(e => 'U+' + e.codePointAt(0).toString(16).toUpperCase()).join(' ')
}
