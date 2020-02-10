#!/usr/bin/env node

const {join} = require("path")
const {existsSync, readFileSync, writeFileSync} = require("fs")

const doc = process.argv.slice(2)

if (doc.length === 0) {
  console.log('do not have files');
  return
}

const dict = new Set()

doc.forEach(rtp => {
  const tagPath = join(rtp, 'doc', 'tags')
  if (existsSync(tagPath)) {
    const tags = readFileSync(tagPath).toString().split('\n')
    tags.forEach(line => {
      line = line.trim()
      firstSection = line.split(' ')[0]
      // delete first `xxxx:`
      firstSection = firstSection.replace(/^[^:]:/, '')
      const words = firstSection.split(/[^a-zA-Z]/g)
      words.forEach(word => {
        word = word.replace(/[^a-zA-Z]/g, '')
        if (word.length > 2) {
          dict.add(word)
        }
      })
    })
  } else {
    console.log(`file ${tagPath} does not exists`)
  }
})

let content = ''

for (let word of dict) {
  if (content !== '') {
    content += ('\n' + word)
  } else {
    content = word
  }
}

console.log(`write to ${join(__dirname, 'vim.txt')}`);

writeFileSync(join(__dirname, 'vim.txt'), content)
