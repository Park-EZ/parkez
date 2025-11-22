import { getDB } from '../config/database.js'
import { findById, createIdQuery } from '../utils/idHelpers.js'

export default async function levelRoutes(fastify, options) {
  // GET /api/levels - list all levels
  fastify.get('/', async (request, reply) => {
    const db = getDB()
    const levels = await db.collection('levels').find().toArray()
    return levels
  })

  // GET /api/levels/:id/availability - Get availability counts for a level (database aggregation)
  // Must be defined BEFORE /:id route to avoid route conflicts
  fastify.get('/:id/availability', async (request, reply) => {
    const db = getDB()
    const levelIdParam = request.params.id
    
    // Find the level to get its numeric id field
    const level = await findById(db.collection('levels'), levelIdParam)
    // const numericId = Number(request.params.id)
    // const level = await db.collection('levels').findOne({ id: numericId })
    if (!level) {
      return reply.code(404).send({ error: 'Level not found' })
    }
    
    // Use the level's numeric id field to query spots
    const numericLevelId = level.id
    
    // Use aggregation to count spots directly in database
    // Count free spots where user_id is null or empty string
    const result = await db.collection('spots').aggregate([
      {
        $match: {
          levelId: numericLevelId
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

  // GET /api/levels/:id - Get level by ID
  fastify.get('/:id', async (request, reply) => {
    const db = getDB()
    const level = await findById(db.collection('levels'), request.params.id)

    // const numericId = Number(request.params.id)
    // const level = await db.collection('levels').findOne({ id: numericId })
    
    if (!level) {
      return reply.code(404).send({ error: 'Level not found' })
    }
    
    return level
  })

  // GET /api/levels/:id/spots - Get spots for a level
  // Spots reference levels via levelId field which matches the level's id field
  fastify.get('/:id/spots', async (request, reply) => {
    const db = getDB()
    const levelIdParam = request.params.id
    
    // Find the level by _id to get its numeric id field
    const level = await findById(db.collection('levels'), levelIdParam)
    // const numericId = Number(request.params.id)
    // const level = await db.collection('levels').findOne({ id: numericId })
    
    if (!level) {
      return reply.code(404).send({ error: 'Level not found' })
    }
    
    // Use the level's numeric id field to query spots
    // Spots have levelId field that references level.id from JSON
    const numericLevelId = level.id
    
    const spots = await db.collection('spots')
      .find({ levelId: numericLevelId })
      .sort({ id: 1 }) // Sort by id for consistent ordering
      .toArray()
    
    return spots
  })

}
