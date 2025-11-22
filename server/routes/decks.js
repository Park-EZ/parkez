import { getDB } from '../config/database.js'
import { findById, createDeckIdQuery } from '../utils/idHelpers.js'

export default async function deckRoutes(fastify, options) {
  // GET /api/decks - Get all decks
  fastify.get('/', async (request, reply) => {
    const db = getDB()
    const decks = await db.collection('decks').find({}).toArray()
    return decks
  })

  // GET /api/decks/:id - Get deck by ID
  fastify.get('/:id', async (request, reply) => {
    const db = getDB()
    const deck = await findById(db.collection('decks'), request.params.id)
    
    if (!deck) {
      return reply.code(404).send({ error: 'Deck not found' })
    }
    
    return deck
  })

  // GET /api/decks/:id/levels - Get levels for a deck
  // This endpoint finds levels where deckId matches the deck
  // Handles multiple ID formats: ObjectId _id, building-code, and legacy string IDs (deckA, deckB, etc.)
  fastify.get('/:id/levels', async (request, reply) => {
    const db = getDB()
    const deckIdParam = request.params.id
    
    // First, find the deck to get its actual _id and building-code
    const deck = await findById(db.collection('decks'), deckIdParam)
    
    if (!deck) {
      return reply.code(404).send({ error: 'Deck not found' })
    }
    
    // Create a comprehensive query that tries multiple matching strategies
    // Levels may reference decks by: ObjectId _id, building-code, or legacy IDs like "deckA"
    const query = await createDeckIdQuery(db, deck)
    
    // Query levels collection with the comprehensive query
    const levels = await db.collection('levels')
      .find(query)
      .sort({ index: 1 })
      .toArray()
    
    return levels
  })
}

