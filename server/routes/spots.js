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

    // Find spot where user_id matches current user
    // Note: Only non-null/non-empty user_id values will match
    const spot = await db.collection('spots').findOne({
      user_id: userId
    })

    if (!spot) {
      return reply.code(404).send({ error: 'No active spot found' })
    }

    // Get level info using the id field from levels collection
    const level = await db.collection('levels').findOne({ id: spot.levelId })
    
    // Get deck info if level exists
    let deck = null
    if (level && level.deckId) {
      // Find deck by building-code matching level's deckId
      deck = await db.collection('decks').findOne({ 'building-code': level.deckId })
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
    const spotId = parseInt(request.params.id) // Convert to number as per JSON structure
    const userId = request.user?.id || null
    
    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    // Find spot by id field (not _id, as per JSON structure)
    const spot = await db.collection('spots').findOne({ id: spotId })
    
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    // Check if spot is already occupied (user_id is not empty/null)
    if (spot.user_id && spot.user_id !== '') {
      return reply.code(400).send({ error: 'Spot is already occupied' })
    }

    // Check if user already has an active spot
    // Query for spots where user_id matches (will only match non-null/non-empty values)
    const existingSpot = await db.collection('spots').findOne({
      user_id: userId
    })

    if (existingSpot) {
      // Return 409 Conflict with current spot info so frontend can show confirmation dialog
      return reply.code(409).send({ 
        error: 'You already have an occupied spot',
        currentSpot: {
          _id: existingSpot._id,
          id: existingSpot.id,
          label: existingSpot.label,
          levelId: existingSpot.levelId
        },
        newSpotId: spotId,
        newSpotLabel: spot.label
      })
    }

    // Update spot: set user_id and mark as not available
    await db.collection('spots').updateOne(
      { id: spotId },
      { 
        $set: { 
          user_id: userId,
          available: false,
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

    const updatedSpot = await db.collection('spots').findOne({ id: spotId })
    return { success: true, spot: updatedSpot }
  })

  // POST /api/spots/:id/check-out - Check out of a spot
  // Requires authentication - user can only free their own spot
  fastify.post('/:id/check-out', { preHandler: authenticate }, async (request, reply) => {
    const db = getDB()
    const spotId = parseInt(request.params.id) // Convert to number as per JSON structure
    const userId = request.user?.id || null
    
    if (!userId) {
      return reply.code(401).send({ error: 'Authentication required' })
    }

    // Find spot by id field (not _id)
    const spot = await db.collection('spots').findOne({ id: spotId })
  
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    // Verify user owns this spot
    if (!spot.user_id || spot.user_id !== userId) {
      return reply.code(403).send({ error: 'You can only free your own spot' })
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
  
    // Update spot: clear user_id and mark as available
    await db.collection('spots').updateOne(
      { id: spotId },
      { 
        $set: { 
          user_id: null,
          available: true
        },
        $unset: { occupiedAt: '' }
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

    const updatedSpot = await db.collection('spots').findOne({ id: spotId })
    return { success: true, spot: updatedSpot }
  })

  // POST /api/spots/:id/toggle - Toggle spot occupancy (admin/manual)
  fastify.post('/:id/toggle', async (request, reply) => {
    const db = getDB()
    const spotId = parseInt(request.params.id) // Convert to number as per JSON structure

    const spot = await db.collection('spots').findOne({ id: spotId })
    
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    // Toggle based on user_id presence
    const isCurrentlyOccupied = spot.user_id && spot.user_id !== ''
    const updateQuery = isCurrentlyOccupied
      ? { $set: { user_id: null, available: true }, $unset: { occupiedAt: '' } }
      : { $set: { user_id: 'admin', available: false, occupiedAt: new Date() } }
    
    await db.collection('spots').updateOne(
      { id: spotId },
      updateQuery
    )

    // Record state history
    await db.collection('spotStateHistory').insertOne({
      spotId: spotId,
      at: new Date(),
      state: isCurrentlyOccupied ? 'free' : 'occupied',
      reason: 'manual-toggle'
    })

    const updatedSpot = await db.collection('spots').findOne({ id: spotId })
    return { success: true, spot: updatedSpot }
  })
}

