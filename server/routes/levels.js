import { getDB } from '../config/database.js'

export default async function levelRoutes(fastify, options) {
  // GET /api/levels - list all levels
  fastify.get('/', async (request, reply) => {
    const db = getDB()
    const levels = await db.collection('levels').find().toArray()
    return levels
  })

  // GET /api/levels/:id/spots - Get spots for a level
  fastify.get('/:id/spots', async (request, reply) => {
    const db = getDB()
    const spots = await db.collection('spots')
      .find({ levelId: request.params.id })
      .toArray()
    
    return spots
  })
}

