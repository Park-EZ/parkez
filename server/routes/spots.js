import { getDB } from '../config/database.js'
import { ObjectId } from 'mongodb'

export default async function spotRoutes(fastify, options) {
  // POST /api/spots/:id/check-in - Check in to a spot
  fastify.post('/:id/check-in', async (request, reply) => {
    const db = getDB()
    const spotId = request.params.id
    const userEmail = request.body?.email || null
    const spot = await db.collection('spots').findOne({ _id: spotId })
    
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    if (spot.status === 'occupied') {
      return reply.code(400).send({ error: 'Spot is already occupied' })
    }

    // Update spot status
    await db.collection('spots').updateOne(
      { _id: spotId },
      { $set: { status: 'occupied' } }
    )

    // Create spot session
    const session = {
      spotId: spotId,
      userEmail: userEmail,
      startedAt: new Date(),
      endedAt: null,
      source: 'qr'
    }
    await db.collection('spotSessions').insertOne(session)

    // Record state history
    await db.collection('spotStateHistory').insertOne({
      _id: spotId,
      at: new Date(),
      state: 'occupied',
      reason: 'check-in'
    })

    return { success: true, spot: { ...spot, status: 'occupied' } }
  })

  // POST /api/spots/:id/check-out - Check out of a spot
  // POST /api/spots/:id/check-out - Check out of a spot
fastify.post('/:id/check-out', async (request, reply) => {
  const db = getDB()
  const spotId = request.params.id
  const userEmail = request.body?.email || null
  const spot = await db.collection('spots').findOne({ _id: spotId })
  
  if (!spot) {
    return reply.code(404).send({ error: 'Spot not found' })
  }

  // Find active session
  const session = await db.collection('spotSessions').findOne({
    spotId: spotId,
    endedAt: null
  })

  if (!session) {
    return reply.code(400).send({ error: 'No active session found for this spot' })
  }
  
  // Update spot status
  await db.collection('spots').updateOne(
    { _id: spotId },
    { $set: { status: 'free' } }
  )

  // End session - FIXED: use _id to find the session
  await db.collection('spotSessions').updateOne(
    { _id: session._id },
    { $set: { endedAt: new Date() } }
  )

  // Record state history
  await db.collection('spotStateHistory').insertOne({
    spotId: spotId,
    at: new Date(),
    state: 'free',
    reason: 'check-out'
  })

  return { success: true, spot: { ...spot, status: 'free' } }
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

    await db.collection('spots').updateOne(
      { _id: spotId },
      { $set: { status: newStatus } }
    )

    // Record state history
    await db.collection('spotStateHistory').insertOne({
      _id: spotId,
      at: new Date(),
      state: newStatus,
      reason: 'manual-toggle'
    })

    return { success: true, spot: { ...spot, status: newStatus } }
  })
}

