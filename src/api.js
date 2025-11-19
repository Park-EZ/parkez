// API base URL - from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Real-time subscription listeners
const listeners = new Set()

// Initialize/seed data
export async function seedIfEmpty() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/seed`, { method: 'POST' })
    if (!response.ok) throw new Error('Seed failed')
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  }
}

// Get all decks
export async function getDecks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/decks`)
    if (!response.ok) throw new Error('Failed to fetch decks')
    return await response.json()
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Get levels by deck ID
export async function getLevelsByDeck(deckId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/decks/${deckId}/levels`)
    if (!response.ok) throw new Error('Failed to fetch levels')
    return await response.json()
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Get spots by level ID
export async function getSpotsByLevel(levelId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/levels/${levelId}/spots`)
    if (!response.ok) throw new Error('Failed to fetch spots')
    return await response.json()
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Toggle spot occupancy (for manual toggle)
export async function toggleSpotOccupancy(spotId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (!response.ok) throw new Error('Failed to toggle spot')
    const result = await response.json()
    notify()
    return result
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Apply spot session (check-in/check-out via QR)
export async function applySpotSession(spotId) {
  const email = localStorage.getItem("userEmail")
  try {
    const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email})
    })
    if (!response.ok) throw new Error('Failed to check in')
    const result = await response.json()
    notify()
    return result
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Check out of a spot
export async function checkOutSpot(spotId) {
  const email = localStorage.getItem("userEmail")
  try {
    const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    if (!response.ok) throw new Error('Failed to check out')
    const result = await response.json()
    notify()
    return result
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}
// export async function checkOutSpot(spotId) {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/spots/${spotId}/check-out`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({})
//     })
//     if (!response.ok) throw new Error('Failed to check out')
//     const result = await response.json()
//     notify()
//     return result
//   } catch (error) {
//     console.error('API error:', error)
//     throw error
//   }
// }

// Report incorrect spot status
export async function reportSpotStatus(spotId, reportType, notes = '') {
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

// Subscribe to real-time updates
export function subscribe(fn) {
  listeners.add(fn)
  
  // TODO: Set up WebSocket/SSE connection for real-time updates
  // const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/ws`)
  // ws.onmessage = (event) => {
  //   const data = JSON.parse(event.data)
  //   fn(data)
  // }
}

// Unsubscribe from updates
export function unsubscribe(fn) {
  listeners.delete(fn)
}

// Notify all listeners
function notify() {
  listeners.forEach(fn => fn())
}
