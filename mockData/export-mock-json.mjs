// export-mock-json.mjs
import fs from 'fs'
import path from 'path'
import { initialDecks, initialLevels, initialSpots } from '../src/mockData.js'

fs.writeFileSync(path.resolve('decks.json'), JSON.stringify(initialDecks, null, 2))
fs.writeFileSync(path.resolve('levels.json'), JSON.stringify(initialLevels, null, 2))
fs.writeFileSync(path.resolve('spots.json'), JSON.stringify(initialSpots, null, 2))

console.log('Written decks.json, levels.json, spots.json')