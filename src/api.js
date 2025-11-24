import { apiRequest } from '@/utils/api'

const listeners = new Set()

export async function seedIfEmpty() {
  const response = await apiRequest('/api/seed', { method: 'POST' })
  if (!response.ok) throw new Error('Seed failed')
}

export async function getDecks() {
  const response = await apiRequest('/api/decks')
  if (!response.ok) throw new Error('Failed to fetch decks')
  return await response.json()
}

export async function getLevelsByDeck(deckId) {
  const response = await apiRequest(`/api/decks/${deckId}/levels`)
  if (!response.ok) throw new Error('Failed to fetch levels')
  return await response.json()
}

export async function getSpotsByLevel(levelId) {
  const response = await apiRequest(`/api/levels/${levelId}/spots`)
  if (!response.ok) throw new Error('Failed to fetch spots')
  return await response.json()
}

export async function getDeckAvailability(deckId) {
  const response = await apiRequest(`/api/decks/${deckId}/availability`)
  if (!response.ok) throw new Error('Failed to fetch deck availability')
  return await response.json()
}

export async function getLevelAvailability(levelId) {
  const response = await apiRequest(`/api/levels/${levelId}/availability`)
  if (!response.ok) throw new Error('Failed to fetch level availability')
  return await response.json()
}

export async function toggleSpotOccupancy(spotId) {
  const response = await apiRequest(`/api/spots/${spotId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({})
  })
  if (!response.ok) throw new Error('Failed to toggle spot')
  const result = await response.json()
  notify()
  return result
}

export async function checkInSpot(spotId) {
  const response = await apiRequest(`/api/spots/${spotId}/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'manual' })
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    if (response.status === 409) {
      throw { ...new Error(errorData.error || 'You already have an occupied spot'), conflictData: errorData }
    }
    throw new Error(errorData.error || 'Failed to check in')
  }
  const result = await response.json()
  notify()
  return result
}

export async function applySpotSession(spotId) {
  const response = await apiRequest(`/api/spots/${spotId}/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'qr' })
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    if (response.status === 409) {
      throw { ...new Error(errorData.error || 'You already have an occupied spot'), conflictData: errorData }
    }
    throw new Error(errorData.error || 'Failed to check in')
  }
  const result = await response.json()
  notify()
  return result
}

export async function checkOutSpot(spotId) {
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
}

export async function getMySpot() {
  const response = await apiRequest('/api/spots/my-spot')
  if (!response.ok) {
    if (response.status === 404) return null
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch current spot')
  }
  return await response.json()
}

export async function reportSpotStatus(spotId, reportType, notes = '') {
  const response = await apiRequest(`/api/spots/${spotId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reportType, notes }),
  })
  if (!response.ok) throw new Error('Failed to submit report')
  return await response.json()
}

export function subscribe(fn) {
  listeners.add(fn)
}

export function unsubscribe(fn) {
  listeners.delete(fn)
}

function notify() {
  listeners.forEach(fn => fn())
}
