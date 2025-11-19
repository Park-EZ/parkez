import { getDB } from '../config/database.js'

export default async function userRoutes(fastify, options) {
  // GET /api/users or GET /api/users?email=...
  fastify.get('/', async (request, reply) => {
    const db = getDB()
    const { email } = request.query

    try {
      // If email query is provided, return a single user
      if (email) {
        const user = await db.collection('users').findOne({ email })

        if (!user) {
          return reply.code(404).send({ error: 'User not found' })
        }

        const { password: _, ...userResponse } = user
        return userResponse
      }

      // Otherwise: return all users
      const users = await db.collection('users')
        .find({})
        .project({ password: 0 }) // remove passwords for all users
        .toArray()

      return users
    } catch (err) {
      fastify.log.error({ err, route: 'GET /api/users' }, 'Failed to fetch users')
      return reply.code(500).send({ error: 'Internal server error' })
    }
  })
}