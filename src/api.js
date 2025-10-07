import { initialDecks, initialLevels, initialSpots } from './mockData'

const K = { decks: 'pk_decks', levels: 'pk_levels', spots: 'pk_spots' }
const read = k => JSON.parse(localStorage.getItem(k) || 'null')
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export function seedIfEmpty() {
  if (!read(K.decks)) write(K.decks, initialDecks)
  if (!read(K.levels)) write(K.levels, initialLevels)
  if (!read(K.spots)) write(K.spots, initialSpots)

  if (!window.__parkingTicker) {
    window.__parkingTicker = setInterval(() => {
      const spots = read(K.spots) || []
      if (!spots.length) return
      const i = Math.floor(Math.random() * spots.length)
      if (spots[i].type !== 'ADA') {
        spots[i].status = spots[i].status === 'free' ? 'occupied' : 'free'
        write(K.spots, spots)
        notify()
      }
    }, 4000)
  }
}

export function getDecks() { return read(K.decks) || [] }
export function getLevelsByDeck(deckId) {
  const all = read(K.levels) || []
  return all.filter(l => l.deckId === deckId).sort((a,b)=>a.index-b.index)
}
export function getSpotsByLevel(levelId) {
  const all = read(K.spots) || []
  return all.filter(s => s.levelId === levelId)
}
export function toggleSpotOccupancy(spotId) {
  const spots = read(K.spots) || []
  const i = spots.findIndex(s => s._id === spotId)
  if (i >= 0) {
    spots[i].status = spots[i].status === 'free' ? 'occupied' : 'free'
    write(K.spots, spots)
    notify()
  }
}
export function applySpotSession(spotId){ toggleSpotOccupancy(spotId) }

const listeners = new Set()
export function subscribe(fn){ listeners.add(fn) }
export function unsubscribe(fn){ listeners.delete(fn) }
function notify(){ listeners.forEach(fn=>fn()) }
