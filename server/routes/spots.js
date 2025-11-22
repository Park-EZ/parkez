import { getDB } from '../config/database.js'
import { ObjectId } from 'mongodb'
import { authenticate } from '../middleware/auth.js'

export default async function spotRoutes(fastify, options) {
  // GET /api/spots/my-spot - Get current user's occupied spot
  // Must be defined BEFORE /:id routes to avoid route conflicts
  fastify.get('/my-spot', { preHandler: authenticate }, async (request, reply) => {
    const db = getDB()
    const userId = request.user?.id || null
    
    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    const spot = await db.collection('spots').findOne({
      status: 'occupied',
      occupiedBy: userId
    })

    if (!spot) {
      return reply.code(404).send({ error: 'No active spot found' })
    }

    // Get level info
    const level = await db.collection('levels').findOne({ _id: spot.levelId })
    
    // Get deck info if level exists
    let deck = null
    if (level && level.deckId) {
      // Try to find deck by deckId (could be "deckA", "deckB", ObjectId, or building-code)
      const { getDeckIndexLetter } = await import('../utils/idHelpers.js')
      const allDecks = await db.collection('decks').find({}).sort({ 'building-code': 1 }).toArray()
      
      // Try matching by deckId pattern
      for (const d of allDecks) {
        const deckLetter = await getDeckIndexLetter(db, d)
        if (deckLetter && `deck${deckLetter}` === level.deckId) {
          deck = d
          break
        }
        if (d._id.toString() === level.deckId || d['building-code'] === level.deckId) {
          deck = d
          break
        }
      }
    }

    return {
      spot,
      level,
      deck
    }
  })

  // POST /api/spots/:id/check-in - Check in to a spot
  // Requires authentication - user can only occupy one spot at a time
  fastify.post('/:id/check-in', { preHandler: authenticate }, async (request, reply) => {
    const db = getDB()
    const spotId = request.params.id
    const userId = request.user?.id || null
    
    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    const spot = await db.collection('spots').findOne({ _id: spotId })
    
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    if (spot.status === 'occupied') {
      return reply.code(400).send({ error: 'Spot is already occupied' })
    }

    // Check if user already has an active spot
    const existingSpot = await db.collection('spots').findOne({
      status: 'occupied',
      occupiedBy: userId
    })

    if (existingSpot) {
      // Return 409 Conflict with current spot info so frontend can show confirmation dialog
      return reply.code(409).send({ 
        error: 'You already have an occupied spot',
        currentSpot: {
          _id: existingSpot._id,
          label: existingSpot.label,
          levelId: existingSpot.levelId
        },
        newSpotId: spotId,
        newSpotLabel: spot.label
      })
    }

    // Update spot status and store userId
    await db.collection('spots').updateOne(
      { _id: spotId },
      { 
        $set: { 
          status: 'occupied',
          occupiedBy: userId,
          occupiedAt: new Date()
        } 
      }
    )

    // Create spot session
    const session = {
      spotId: spotId,
      userId: userId,
      userEmail: request.user?.email || null,
      startedAt: new Date(),
      endedAt: null,
      source: request.body?.source || 'qr'
    }
    await db.collection('spotSessions').insertOne(session)

    // Record state history
    await db.collection('spotStateHistory').insertOne({
      spotId: spotId,
      at: new Date(),
      state: 'occupied',
      reason: 'check-in',
      userId: userId
    })

    const updatedSpot = await db.collection('spots').findOne({ _id: spotId })
    return { success: true, spot: updatedSpot }
  })

  // POST /api/spots/:id/check-out - Check out of a spot
  // Requires authentication - user can only free their own spot
  fastify.post('/:id/check-out', { preHandler: authenticate }, async (request, reply) => {
    const db = getDB()
    const spotId = request.params.id
    const userId = request.user?.id || null
    
    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    const spot = await db.collection('spots').findOne({ _id: spotId })
  
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    // Verify user owns this spot
    if (spot.occupiedBy !== userId) {
      return reply.code(403).send({ error: 'You can only free your own spot' })
    }

    if (spot.status !== 'occupied') {
      return reply.code(400).send({ error: 'Spot is not currently occupied' })
    }

    // Find active session
    const session = await db.collection('spotSessions').findOne({
      spotId: spotId,
      userId: userId,
      endedAt: null
    })

    if (!session) {
      return reply.code(400).send({ error: 'No active session found for this spot' })
    }
  
    // Update spot status and clear userId
    await db.collection('spots').updateOne(
      { _id: spotId },
      { 
        $set: { status: 'free' },
        $unset: { occupiedBy: '', occupiedAt: '' }
      }
    )

    // End session
    await db.collection('spotSessions').updateOne(
      { _id: session._id },
      { $set: { endedAt: new Date() } }
    )

    // Record state history
    await db.collection('spotStateHistory').insertOne({
      spotId: spotId,
      at: new Date(),
      state: 'free',
      reason: 'check-out',
      userId: userId
    })

    const updatedSpot = await db.collection('spots').findOne({ _id: spotId })
    return { success: true, spot: updatedSpot }
  })

  // POST /api/spots/:id/toggle - Toggle spot occupancy (admin/manual)
  fastify.post('/:id/toggle', async (request, reply) => {
    const db = getDB()
    const spotId = request.params.id

    const spot = await db.collection('spots').findOne({ _id: spotId })
    
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    const newStatus = spot.status === 'free' ? 'occupied' : 'free'
    const updateQuery = newStatus === 'free' 
      ? { $set: { status: newStatus }, $unset: { occupiedBy: '', occupiedAt: '' } }
      : { $set: { status: newStatus } }
    
    await db.collection('spots').updateOne(
      { _id: spotId },
      updateQuery
    )

    // Record state history
    await db.collection('spotStateHistory').insertOne({
      spotId: spotId,
      at: new Date(),
      state: newStatus,
      reason: 'manual-toggle'
    })

    const updatedSpot = await db.collection('spots').findOne({ _id: spotId })
    return { success: true, spot: updatedSpot }
  })
}

