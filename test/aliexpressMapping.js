const extractor = require('../src/services/extractors')

const fs = require('fs')

const json = fs.readFileSync('./test/ali3.json')
let output = extractor.getAliProductDetail(json)

console.log(JSON.stringify(output))
