import { apiRequest } from '@/utils/api'

// Real-time subscription listeners
const listeners = new Set()

// Initialize/seed data
export async function seedIfEmpty() {
  try {
    const response = await apiRequest('/api/seed', { method: 'POST' })
    if (!response.ok) throw new Error('Seed failed')
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  }
}

// Get all decks
export async function getDecks() {
  try {
    const response = await apiRequest('/api/decks')
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
    const response = await apiRequest(`/api/decks/${deckId}/levels`)
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
    const response = await apiRequest(`/api/levels/${levelId}/spots`)
    if (!response.ok) throw new Error('Failed to fetch spots')
    return await response.json()
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Get availability counts for a deck (database aggregation - efficient)
export async function getDeckAvailability(deckId) {
  try {
    const response = await apiRequest(`/api/decks/${deckId}/availability`)
    if (!response.ok) throw new Error('Failed to fetch deck availability')
    return await response.json()
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Get availability counts for a level (database aggregation - efficient)
export async function getLevelAvailability(levelId) {
  try {
    const response = await apiRequest(`/api/levels/${levelId}/availability`)
    if (!response.ok) throw new Error('Failed to fetch level availability')
    return await response.json()
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Toggle spot occupancy (for manual toggle)
export async function toggleSpotOccupancy(spotId) {
  try {
    const response = await apiRequest(`/api/spots/${spotId}/toggle`, {
      method: 'POST',
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

// Check in to a spot
export async function checkInSpot(spotId) {
  try {
    const response = await apiRequest(`/api/spots/${spotId}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'manual' })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // If 409 Conflict, return the error data so frontend can show confirmation
      if (response.status === 409) {
        throw { ...new Error(errorData.error || 'You already have an occupied spot'), conflictData: errorData }
      }
      throw new Error(errorData.error || 'Failed to check in')
    }
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
  try {
    const response = await apiRequest(`/api/spots/${spotId}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'qr' })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      // If 409 Conflict, return the error data so frontend can show confirmation
      if (response.status === 409) {
        throw { ...new Error(errorData.error || 'You already have an occupied spot'), conflictData: errorData }
      }
      throw new Error(errorData.error || 'Failed to check in')
    }
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
  try {
    const response = await apiRequest(`/api/spots/${spotId}/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to check out')
    }
    const result = await response.json()
    notify()
    return result
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}

// Get current user's occupied spot
export async function getMySpot() {
  try {
    const response = await apiRequest('/api/spots/my-spot')
    if (!response.ok) {
      if (response.status === 404) {
        return null // No active spot - this is normal, not an error
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to fetch current spot')
    }
    return await response.json()
  } catch (error) {
    // If it's a 404, return null (no spot is normal)
    if (error.message?.includes('404') || error.message?.includes('No active spot')) {
      return null
    }
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
    const response = await apiRequest(`/api/spots/${spotId}/report`, {
      method: 'POST',
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
