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

    const spot = await db.collection('spots').findOne({ _id: new ObjectId(spotId) })
    
    if (!spot) {
      return reply.code(404).send({ error: 'Spot not found' })
    }

    const report = {
      spotId: new ObjectId(spotId),
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

