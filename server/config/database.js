import { MongoClient } from 'mongodb'

let client = null
let db = null

export async function connectDB() {
  if (client && db) {
    console.log('MongoDB: Already connected')
    return db
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  const DB_NAME = process.env.DB_NAME || 'ezpark'

  console.log('MongoDB: Attempting to connect...')
  console.log(`   URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)
  console.log(`   Database: ${DB_NAME}`)

  try {
    const startTime = Date.now()
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    })

    await client.connect()
    const connectionTime = Date.now() - startTime
    
    await client.db('admin').command({ ping: 1 })
    db = client.db(DB_NAME)
    await db.listCollections().toArray()
    
    console.log(`MongoDB: Connected successfully (${connectionTime}ms)`)
    console.log(`   Database: ${DB_NAME} (verified/created)`)
    
    console.log('MongoDB: Initializing database schema...')
    await initializeSchema(db)
    console.log('MongoDB: Database schema initialized')
    
    return db
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('MongoDB: Connection failed')
    console.error(`   Error: ${error.message}`)
    console.error(`   Error Code: ${error.code || 'N/A'}`)
    
    if (error.message.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED') {
      console.error('   Tip: Make sure MongoDB is running')
      console.error('   Local: Start MongoDB service or run: docker-compose up -d')
      console.error('   Remote: Check connection string and network access')
    } else if (error.message.includes('authentication') || error.code === 18 || error.code === 13) {
      console.error('   Tip: Check MongoDB credentials in MONGODB_URI')
      console.error('   Docker: mongodb://admin:password@localhost:27017/ezpark?authSource=admin')
      console.error('   Make sure .env file is in project root and contains MONGODB_URI')
    } else if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error('   Tip: Check network connectivity and MongoDB server status')
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    if (client) {
      try {
        await client.close()
      } catch (closeError) {
        // Ignore
      }
      client = null
      db = null
    }
    
    throw new Error(`Database connection failed: ${error.message}`)
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.')
  }
  return db
}

async function initializeSchema(db) {
  try {
    await createCollections(db)
    await createIndexes(db)
  } catch (error) {
    console.error('   Error initializing schema:', error.message)
    throw error
  }
}

async function createCollections(db) {
  const collections = ['decks', 'levels', 'spots', 'spotSessions', 'spotStateHistory', 'users', 'spotReports']

  console.log('   Creating collections...')
  for (const collectionName of collections) {
    try {
      const existingCollections = await db.listCollections({ name: collectionName }).toArray()
      
      if (existingCollections.length === 0) {
        await db.createCollection(collectionName)
        console.log(`   Collection '${collectionName}' created`)
      } else {
        console.log(`   Collection '${collectionName}' exists`)
      }
    } catch (error) {
      if (error.code !== 48) {
        console.log(`   Collection '${collectionName}': ${error.message}`)
      } else {
        console.log(`   Collection '${collectionName}' exists`)
      }
    }
  }
}

async function createIndexes(db) {
  console.log('   Creating indexes...')
  
  const indexes = [
    { collection: 'decks', index: { 'building-code': 1 }, options: { unique: true, name: 'building-code' } },
    { collection: 'decks', index: { 'building-name': 1 }, options: { name: 'building-name' } },
    { collection: 'levels', index: { deckId: 1, index: 1 }, options: { name: 'deckId_index' } },
    { collection: 'levels', index: { deckId: 1 }, options: { name: 'deckId' } },
    { collection: 'levels', index: { _id: 1 }, options: { unique: true, name: '_id' } },
    { collection: 'spots', index: { levelId: 1 }, options: { name: 'levelId' } },
    { collection: 'spots', index: { label: 1, levelId: 1 }, options: { unique: true, name: 'label_levelId' } },
    { collection: 'spots', index: { handicap: 1 }, options: { name: 'handicap' } },
    { collection: 'spots', index: { user_id: 1 }, options: { name: 'user_id', sparse: true } },
    { collection: 'spots', index: { available: 1 }, options: { name: 'available' } },
    { collection: 'spotSessions', index: { spotId: 1, endedAt: 1 }, options: { name: 'spotId_endedAt' } },
    { collection: 'spotSessions', index: { userId: 1, endedAt: 1 }, options: { name: 'userId_endedAt' } },
    { collection: 'spotSessions', index: { spotId: 1 }, options: { name: 'spotId' } },
    { collection: 'spotSessions', index: { userId: 1 }, options: { name: 'userId' } },
    { collection: 'spotSessions', index: { endedAt: 1 }, options: { name: 'endedAt' } },
    { collection: 'spotStateHistory', index: { spotId: 1, at: -1 }, options: { name: 'spotId_at' } },
    { collection: 'spotStateHistory', index: { spotId: 1 }, options: { name: 'spotId' } },
    { collection: 'spotStateHistory', index: { at: -1 }, options: { name: 'at' } },
    { collection: 'spotStateHistory', index: { userId: 1 }, options: { name: 'userId', sparse: true } },
    { collection: 'users', index: { email: 1 }, options: { unique: true, name: 'email' } },
    { collection: 'spotReports', index: { spotId: 1 }, options: { name: 'spotId' } },
    { collection: 'spotReports', index: { userId: 1 }, options: { name: 'userId' } },
    { collection: 'spotReports', index: { status: 1 }, options: { name: 'status' } },
    { collection: 'spotReports', index: { createdAt: -1 }, options: { name: 'createdAt' } },
  ]

  for (const { collection, index, options } of indexes) {
    try {
      await db.collection(collection).createIndex(index, options)
      console.log(`   Index '${options.name}' on '${collection}'`)
    } catch (err) {
      if (err.code === 85 || err.code === 86) {
        console.log(`   Index '${options.name}' on '${collection}' (already exists)`)
      } else if (err.code !== 27) {
        console.log(`   Index '${options.name}' on '${collection}': ${err.message}`)
      }
    }
  }
}

export async function closeDB() {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('MongoDB connection closed')
  }
}
