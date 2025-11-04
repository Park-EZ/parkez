import { getDB } from '../config/database.js'

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
    const { ObjectId } = await import('mongodb')
    
    let query
    try {
      query = { _id: new ObjectId(request.params.id) }
    } catch {
      query = { _id: request.params.id }
    }
    
    const deck = await db.collection('decks').findOne(query)
    
    if (!deck) {
      return reply.code(404).send({ error: 'Deck not found' })
    }
    
    return deck
  })

  // GET /api/decks/:id/levels - Get levels for a deck
  fastify.get('/:id/levels', async (request, reply) => {
    const db = getDB()
    const levels = await db.collection('levels')
      .find({ deckId: request.params.id })
      .sort({ index: 1 })
      .toArray()
    
    return levels
  })
}

