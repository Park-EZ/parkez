import { getDB } from '../config/database.js'
import { findById, createDeckIdQuery } from '../utils/idHelpers.js'

export default async function deckRoutes(fastify, options) {
  // GET /api/decks - Get all decks
  fastify.get('/', async (request, reply) => {
    const db = getDB()
    const decks = await db.collection('decks').find({}).toArray()
    return decks
  })

  // GET /api/decks/:id/availability - Get availability counts for a deck (database aggregation)
  // Must be defined BEFORE /:id route to avoid route conflicts
  fastify.get('/:id/availability', async (request, reply) => {
    const db = getDB()
    const deckIdParam = request.params.id
    
    // First, find the deck to get its building-code
    const deck = await findById(db.collection('decks'), deckIdParam)
    
    if (!deck) {
      return reply.code(404).send({ error: 'Deck not found' })
    }
    
    const deckCode = deck['building-code']
    
    // Get all level IDs for this deck (levels.deckId matches deck.building-code)
    const levels = await db.collection('levels')
      .find({ deckId: deckCode })
      .project({ id: 1 })
      .toArray()
    
    const levelIds = levels.map(l => l.id)
    
    if (levelIds.length === 0) {
      return { free: 0, total: 0 }
    }
    
    // Use aggregation to count spots directly in database
    // Count free spots where user_id is null or empty string
    const result = await db.collection('spots').aggregate([
      {
        $match: {
          levelId: { $in: levelIds }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          free: {
            $sum: {
              $cond: [
                { $or: [
                  { $eq: ['$user_id', null] }, 
                  { $eq: ['$user_id', ''] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]).toArray()
    
    if (result.length === 0) {
      return { free: 0, total: 0 }
    }
    
    return {
      free: result[0].free || 0,
      total: result[0].total || 0
    }
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
  // Levels reference decks via deckId field which matches the deck's building-code
  fastify.get('/:id/levels', async (request, reply) => {
    const db = getDB()
    const deckIdParam = request.params.id
    
    // First, find the deck to get its building-code
    const deck = await findById(db.collection('decks'), deckIdParam)
    
    if (!deck) {
      return reply.code(404).send({ error: 'Deck not found' })
    }
    
    // Use the deck's building-code to query levels
    // Levels have deckId field that matches deck.building-code
    const deckCode = deck['building-code']
    
    // Query levels collection where deckId matches building-code
    const levels = await db.collection('levels')
      .find({ deckId: deckCode })
      .sort({ index: 1 })
      .toArray()
    
    return levels
  })

}

