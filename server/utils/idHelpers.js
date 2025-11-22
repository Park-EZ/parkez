import { ObjectId } from 'mongodb'

/**
 * Normalize an ID to string format for consistent querying
 * Handles both ObjectId and string formats
 */
export function normalizeId(id) {
  if (!id) return null
  if (id instanceof ObjectId) {
    return id.toString()
  }
  return String(id)
}

/**
 * Create a query that matches an ID in multiple formats
 * Useful for querying relationships where IDs might be stored as ObjectId or string
 */
export function createIdQuery(fieldName, id) {
  if (!id) return {}
  
  const normalizedId = normalizeId(id)
  
  // Try to create ObjectId if possible
  let objectIdQuery = null
  try {
    objectIdQuery = new ObjectId(id)
  } catch {
    // Not a valid ObjectId format
  }
  
  // Return query that matches both string and ObjectId formats
  if (objectIdQuery) {
    return {
      $or: [
        { [fieldName]: normalizedId },
        { [fieldName]: objectIdQuery },
        { [fieldName]: id }
      ]
    }
  }
  
  return {
    $or: [
      { [fieldName]: normalizedId },
      { [fieldName]: id }
    ]
  }
}

/**
 * Get the deck index letter (A, B, C, etc.) based on deck's position
 * This maps deck index to "deckA", "deckB" format used in levels
 */
export async function getDeckIndexLetter(db, deck) {
  if (!deck || !db) return null
  
  // Get all decks sorted by building-code (or _id) to maintain consistent order
  const allDecks = await db.collection('decks')
    .find({})
    .sort({ 'building-code': 1 })
    .toArray()
  
  // Find the index of the current deck
  const deckIndex = allDecks.findIndex(d => 
    d._id.toString() === deck._id.toString() ||
    (deck['building-code'] && d['building-code'] === deck['building-code'])
  )
  
  if (deckIndex === -1) return null
  
  // Convert index to letter (0=A, 1=B, 2=C, etc.)
  const letter = String.fromCharCode(65 + deckIndex) // 65 is 'A' in ASCII
  return letter
}

/**
 * Create a query for deckId that handles multiple ID formats
 * This is needed because levels may reference decks by:
 * - ObjectId _id
 * - building-code (string like "1001")
 * - Legacy string IDs (like "deckA", "deckB" based on deck index)
 */
export async function createDeckIdQuery(db, deck) {
  if (!deck) return {}
  
  const queries = []
  
  // Add deck's _id in all formats
  if (deck._id) {
    queries.push({ deckId: deck._id })
    if (deck._id instanceof ObjectId) {
      queries.push({ deckId: deck._id.toString() })
    } else {
      try {
        queries.push({ deckId: new ObjectId(deck._id) })
      } catch {
        // Not a valid ObjectId
      }
    }
  }
  
  // Add building-code if it exists
  if (deck['building-code']) {
    queries.push({ deckId: deck['building-code'] })
  }
  
  // Add legacy mapping: "deckA", "deckB" etc. based on deck index
  const deckLetter = await getDeckIndexLetter(db, deck)
  if (deckLetter) {
    queries.push({ deckId: `deck${deckLetter}` })
  }
  
  return queries.length > 0 ? { $or: queries } : {}
}

/**
 * Find a document by ID, handling both ObjectId and string formats
 */
export async function findById(collection, id) {
  if (!id) return null
  
  // Try ObjectId first
  try {
    const doc = await collection.findOne({ _id: new ObjectId(id) })
    if (doc) return doc
  } catch {
    // Not a valid ObjectId, continue
  }
  
  // Try as string
  return await collection.findOne({ _id: id })
}

