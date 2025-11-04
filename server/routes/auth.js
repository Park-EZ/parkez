import { getDB } from '../config/database.js'
import { ObjectId } from 'mongodb'

export default async function authRoutes(fastify, options) {
  // POST /api/auth/register - Register new user
  fastify.post('/register', async (request, reply) => {
    const db = getDB()
    const { email, password, name } = request.body

    if (!email || !password || !name) {
      return reply.code(400).send({ error: 'Missing required fields' })
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return reply.code(409).send({ error: 'User already exists' })
    }

    // TODO: Hash password with bcrypt
    const user = {
      _id: new ObjectId(),
      email,
      name,
      password, // TODO: Hash this
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('users').insertOne(user)

    // Remove password from response
    const { password: _, ...userResponse } = user
    return userResponse
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

    // TODO: Verify password with bcrypt
    if (user.password !== password) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    // TODO: Generate JWT token
    const { password: _, ...userResponse } = user
    return userResponse
  })
}

