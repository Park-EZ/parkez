import { getDB } from '../config/database.js'
import { findById, createIdQuery } from '../utils/idHelpers.js'

export default async function levelRoutes(fastify, options) {
  // GET /api/levels - list all levels
  fastify.get('/', async (request, reply) => {
    const db = getDB()
    const levels = await db.collection('levels').find().toArray()
    return levels
  })

  // GET /api/levels/:id - Get level by ID
  fastify.get('/:id', async (request, reply) => {
    const db = getDB()
    const level = await findById(db.collection('levels'), request.params.id)
    
    if (!level) {
      return reply.code(404).send({ error: 'Level not found' })
    }
    
    return level
  })

  // GET /api/levels/:id/spots - Get spots for a level
  // This endpoint finds spots where levelId matches the level's _id
  // Handles both ObjectId and string ID formats
  // Spots reference levels via levelId field which should match the level's _id
  fastify.get('/:id/spots', async (request, reply) => {
    const db = getDB()
    const levelIdParam = request.params.id
    
    // First, find the level to get its actual _id value
    const level = await findById(db.collection('levels'), levelIdParam)
    
    if (!level) {
      return reply.code(404).send({ error: 'Level not found' })
    }
    
    // Use the level's actual _id to query spots
    // Spots reference levels via levelId field
    // Create a query that matches levelId in multiple formats (ObjectId or string)
    const query = createIdQuery('levelId', level._id)
    
    // Query spots collection
    const spots = await db.collection('spots')
      .find(query)
      .toArray()
    
    return spots
  })
}

