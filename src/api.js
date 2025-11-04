import { initialDecks, initialLevels, initialSpots } from './mockData'

// API base URL - from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Use API if enabled in environment or if explicitly set
const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.VITE_USE_API === true
const K = { decks: 'pk_decks', levels: 'pk_levels', spots: 'pk_spots' }
const read = k => JSON.parse(localStorage.getItem(k) || 'null')
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

// Real-time subscription listeners
const listeners = new Set()

// Initialize/seed data
export async function seedIfEmpty() {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/seed`, { method: 'POST' })
      if (!response.ok) throw new Error('Seed failed')
    } catch (error) {
      console.error('Seed failed, using localStorage:', error)
    }
    return
  }

  // LocalStorage fallback
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

// Get all decks
export async function getDecks() {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decks`)
      if (!response.ok) throw new Error('Failed to fetch decks')
      return await response.json()
    } catch (error) {
      console.error('API error, using localStorage:', error)
    }
  }
  return Promise.resolve(read(K.decks) || [])
}

// Get levels by deck ID
export async function getLevelsByDeck(deckId) {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/decks/${deckId}/levels`)
      if (!response.ok) throw new Error('Failed to fetch levels')
      return await response.json()
    } catch (error) {
      console.error('API error, using localStorage:', error)
    }
  }
  const all = read(K.levels) || []
  return Promise.resolve(all.filter(l => l.deckId === deckId).sort((a, b) => a.index - b.index))
}

// Get spots by level ID
export async function getSpotsByLevel(levelId) {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}/spots`)
      if (!response.ok) throw new Error('Failed to fetch spots')
      return await response.json()
    } catch (error) {
      console.error('API error, using localStorage:', error)
    }
  }
  const all = read(K.spots) || []
  return Promise.resolve(all.filter(s => s.levelId === levelId))
}

// Toggle spot occupancy (for manual toggle)
export async function toggleSpotOccupancy(spotId) {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to toggle spot')
      const result = await response.json()
      notify()
      return result
    } catch (error) {
      console.error('API error, using localStorage:', error)
    }
  }
  const spots = read(K.spots) || []
  const i = spots.findIndex(s => s._id === spotId)
  if (i >= 0) {
    spots[i].status = spots[i].status === 'free' ? 'occupied' : 'free'
    write(K.spots, spots)
    notify()
  }
  return Promise.resolve()
}

// Apply spot session (check-in/check-out via QR)
export async function applySpotSession(spotId) {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to check in')
      const result = await response.json()
      notify()
      return result
    } catch (error) {
      console.error('API error, using localStorage:', error)
    }
  }
  // For now, toggle the spot status
  return toggleSpotOccupancy(spotId)
}

// Check out of a spot
export async function checkOutSpot(spotId) {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to check out')
      const result = await response.json()
      notify()
      return result
    } catch (error) {
      console.error('API error, using localStorage:', error)
    }
  }
  return toggleSpotOccupancy(spotId)
}

// Report incorrect spot status
export async function reportSpotStatus(spotId, reportType, notes = '') {
  if (USE_API) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, notes }),
      })
      if (!response.ok) throw new Error('Failed to submit report')
      return await response.json()
    } catch (error) {
      console.error('API error:', error)
      throw error
    }
  }
  // For localStorage, just log it
  console.log('Report submitted:', { spotId, reportType, notes })
  return Promise.resolve({ success: true })
}

// Subscribe to real-time updates
export function subscribe(fn) {
  listeners.add(fn)
  
  if (USE_API) {
    // TODO: Set up WebSocket/SSE connection for real-time updates
    // const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws`)
    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data)
    //   fn(data)
    // }
  }
}

// Unsubscribe from updates
export function unsubscribe(fn) {
  listeners.delete(fn)
}

// Notify all listeners
function notify() {
  listeners.forEach(fn => fn())
}
