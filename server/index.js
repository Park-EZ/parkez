import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { connectDB } from './config/database.js'

// Load .env from project root (parent directory)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env') })
import deckRoutes from './routes/decks.js'
import levelRoutes from './routes/levels.js'
import spotRoutes from './routes/spots.js'
import authRoutes from './routes/auth.js'
import reportRoutes from './routes/reports.js'

console.log('Starting EZpark Backend Server...')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Configuration:')
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`   Port: ${process.env.PORT || 3000}`)
console.log(`   Host: ${process.env.HOST || '0.0.0.0'}`)
console.log(`   Database: ${process.env.DB_NAME || 'ezpark'}`)
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
console.log(`   MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const fastify = Fastify({ 
  logger: process.env.NODE_ENV === 'production' 
    ? true 
    : {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname'
          }
        }
      }
})

// Register CORS
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : true // Allow all origins in development

console.log('Configuring CORS...')
if (Array.isArray(allowedOrigins)) {
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`)
} else {
  console.log('   Allowed origins: All (development mode)')
}

await fastify.register(cors, {
  origin: allowedOrigins,
  credentials: true
})
console.log('CORS configured')

// Connect to MongoDB
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
try {
  await connectDB()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
} catch (error) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('Failed to connect to MongoDB')
  console.error('   Server will not start without database connection')
  process.exit(1)
}

// Register routes
console.log('Registering API routes...')
await fastify.register(deckRoutes, { prefix: '/api/decks' })
console.log('   /api/decks')
await fastify.register(levelRoutes, { prefix: '/api/levels' })
console.log('   /api/levels')
await fastify.register(spotRoutes, { prefix: '/api/spots' })
console.log('   /api/spots')
await fastify.register(authRoutes, { prefix: '/api/auth' })
console.log('   /api/auth')
await fastify.register(reportRoutes, { prefix: '/api/reports' })
console.log('   /api/reports')
console.log('All routes registered')

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})
console.log('   /health')

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000
    const host = process.env.HOST || '0.0.0.0'
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Starting server...')
    console.log(`   Host: ${host}`)
    console.log(`   Port: ${port}`)
    
    await fastify.listen({ port, host })
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Server started successfully!')
    console.log(`   API: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)
    console.log(`   Health: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/health`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } catch (err) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Failed to start server')
    console.error('   Error:', err.message)
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

