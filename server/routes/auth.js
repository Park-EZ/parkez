import { getDB } from '../config/database.js'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

export default async function authRoutes(fastify, options) {
  // POST /api/auth/register - Register new user
  fastify.post('/register', async (request, reply) => {
    const db = getDB()
    const { email, password, name } = request.body

    if (!email || !password || !name) {
      return reply.code(400).send({ error: 'Missing required fields' })
    }

    try {
      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email })
      if (existingUser) {
        return reply.code(409).send({ error: 'User already exists' })
      }

      // Hash password before storing
      const hashed = await bcrypt.hash(password, 10)
      const user = {
        _id: new ObjectId(),
        email,
        name,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await db.collection('users').insertOne(user)

      // Remove password from response
      const { password: _, ...userResponse } = user
      return userResponse
    } catch (err) {
      // Handle duplicate key errors explicitly
      if (err && err.code === 11000) {
        return reply.code(409).send({ error: 'User already exists' })
      }

      // Log server-side error for debugging
      fastify.log.error({ err, route: 'POST /api/auth/register' }, 'Failed to register user')

      // Return a JSON error response instead of letting Fastify default to HTML
      return reply.code(500).send({ error: 'Internal server error' })
    }
  })

  // POST /api/auth/login - Login user
  fastify.post('/login', async (request, reply) => {
    const db = getDB()
    const { email, password } = request.body

    if (!email || !password) {
      return reply.code(400).send({ error: 'Missing email or password' })
    }

    const user = await db.collection('users').findOne({ email })
    
    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    // Verify password with bcrypt
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    // TODO: Generate JWT token
    const { password: _, ...userResponse } = user
    return userResponse
  })
}

