import { getDB } from '../config/database.js'
import { ObjectId } from 'mongodb'

export default async function reportRoutes(fastify, options) {
  // POST /api/reports/spots/:id - Report incorrect spot status
  fastify.post('/spots/:id', async (request, reply) => {
    const db = getDB()
    const spotId = request.params.id
    const { reportType, notes } = request.body
    const userId = request.user?.id || null
    if (!reportType) {
      return reply.code(400).send({ error: 'Missing reportType' })
    }

    // Accept either string IDs (from mock data) or ObjectId strings.
    // Try to build an ObjectId for lookup/storage; fall back to using the raw string.
    let lookupQuery
    let storedSpotId
    try {
      storedSpotId = new ObjectId(spotId)
      lookupQuery = { _id: storedSpotId }
    } catch (err) {
      // Not a valid ObjectId -> use string id (mock data)
      storedSpotId = spotId
      lookupQuery = { _id: spotId }
    }

    const spot = await db.collection('spots').findOne(lookupQuery)
    
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    const report = {
      spotId: storedSpotId,
      userId: userId,
      reportType,
      notes: notes || '',
      status: 'pending',
      createdAt: new Date()
    }

    await db.collection('spotReports').insertOne(report)

    return { success: true, message: 'Report submitted successfully' }
  })
}

