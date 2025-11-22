import { MongoClient } from 'mongodb'

let client = null
let db = null

export async function connectDB() {
  if (client && db) {
    console.log('MongoDB: Already connected')
    return db
  }

  // Read environment variables inside the function to ensure dotenv has loaded them
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  const DB_NAME = process.env.DB_NAME || 'ezpark'

  console.log('MongoDB: Attempting to connect...')
  console.log(`   URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`) // Hide password
  console.log(`   Database: ${DB_NAME}`)

  try {
    const startTime = Date.now()
    client = new MongoClient(MONGODB_URI, {
      // MongoDB connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased timeout for better error handling
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    })

    await client.connect()
    const connectionTime = Date.now() - startTime
    
    // Verify server connection
    await client.db('admin').command({ ping: 1 })
    
    // Create or verify database exists
    db = client.db(DB_NAME)
    
    // Verify database is accessible by listing collections
    await db.listCollections().toArray()
    
    console.log(`MongoDB: Connected successfully (${connectionTime}ms)`)
    console.log(`   Database: ${DB_NAME} (verified/created)`)
    
    // Initialize database schema (collections, indexes, validators)
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
    
    // Clean up connection on error
    if (client) {
      try {
        await client.close()
      } catch (closeError) {
        // Ignore close errors during failure
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

/**
 * Initialize database schema: create collections, indexes, and validators
 */
async function initializeSchema(db) {
  try {
    // Create all collections if they don't exist
    await createCollections(db)
    
    // Create all indexes
    await createIndexes(db)
    
    // Create validators (optional, for data validation)
    await createValidators(db)
  } catch (error) {
    console.error('   Error initializing schema:', error.message)
    throw error
  }
}

/**
 * Create all required collections
 */
async function createCollections(db) {
  const collections = [
    'decks',
    'levels',
    'spots',
    'spotSessions',
    'spotStateHistory',
    'users',
    'spotReports'
  ]

  console.log('   Creating collections...')
  for (const collectionName of collections) {
    try {
      // Check if collection exists
      const existingCollections = await db.listCollections({ name: collectionName }).toArray()
      
      if (existingCollections.length === 0) {
        // Create collection
        await db.createCollection(collectionName)
        console.log(`   Collection '${collectionName}' created`)
      } else {
        console.log(`   Collection '${collectionName}' exists`)
      }
    } catch (error) {
      // Collection might already exist (race condition)
      if (error.code !== 48) { // 48 = NamespaceExists
        console.log(`   Collection '${collectionName}': ${error.message}`)
      } else {
        console.log(`   Collection '${collectionName}' exists`)
      }
    }
  }
}

/**
 * Create all indexes for optimal query performance
 */
async function createIndexes(db) {
  console.log('   Creating indexes...')
  
  const indexes = [
    // Decks collection - based on actual data structure
    { collection: 'decks', index: { 'building-code': 1 }, options: { unique: true, name: 'building-code' } },
    { collection: 'decks', index: { 'building-name': 1 }, options: { name: 'building-name' } },
    
    // Levels collection - based on actual data structure
    { collection: 'levels', index: { deckId: 1, index: 1 }, options: { name: 'deckId_index' } },
    { collection: 'levels', index: { deckId: 1 }, options: { name: 'deckId' } },
    { collection: 'levels', index: { _id: 1 }, options: { unique: true, name: '_id' } },
    
    // Spots collection - based on actual data structure
    { collection: 'spots', index: { levelId: 1 }, options: { name: 'levelId' } },
    { collection: 'spots', index: { label: 1, levelId: 1 }, options: { unique: true, name: 'label_levelId' } },
    { collection: 'spots', index: { status: 1 }, options: { name: 'status' } },
    { collection: 'spots', index: { type: 1 }, options: { name: 'type' } },
    { collection: 'spots', index: { occupiedBy: 1 }, options: { name: 'occupiedBy', sparse: true } },
    { collection: 'spots', index: { status: 1, occupiedBy: 1 }, options: { name: 'status_occupiedBy', sparse: true } },
    
    // Spot Sessions collection
    { collection: 'spotSessions', index: { spotId: 1, endedAt: 1 }, options: { name: 'spotId_endedAt' } },
    { collection: 'spotSessions', index: { userId: 1, endedAt: 1 }, options: { name: 'userId_endedAt' } },
    { collection: 'spotSessions', index: { spotId: 1 }, options: { name: 'spotId' } },
    { collection: 'spotSessions', index: { userId: 1 }, options: { name: 'userId' } },
    { collection: 'spotSessions', index: { endedAt: 1 }, options: { name: 'endedAt' } },
    
    // Spot State History collection
    { collection: 'spotStateHistory', index: { spotId: 1, at: -1 }, options: { name: 'spotId_at' } },
    { collection: 'spotStateHistory', index: { spotId: 1 }, options: { name: 'spotId' } },
    { collection: 'spotStateHistory', index: { at: -1 }, options: { name: 'at' } },
    { collection: 'spotStateHistory', index: { userId: 1 }, options: { name: 'userId', sparse: true } },
    
    // Users collection
    { collection: 'users', index: { email: 1 }, options: { unique: true, name: 'email' } },
    
    // Spot Reports collection
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
      // Index might already exist, which is fine
      if (err.code === 85 || err.code === 86) {
        // 85 = IndexOptionsConflict, 86 = IndexKeySpecsConflict (index already exists)
        console.log(`   Index '${options.name}' on '${collection}' (already exists)`)
      } else if (err.code !== 27) { // 27 = IndexKeySpecsConflict (duplicate key)
        console.log(`   Index '${options.name}' on '${collection}': ${err.message}`)
      }
    }
  }
}

/**
 * Create collection validators for data integrity (optional but recommended)
 * Based on actual data structure from JSON files
 */
async function createValidators(db) {
  console.log('   Setting up validators...')
  
  const validators = [
    {
      collection: 'decks',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['building-code', 'building-name'],
          properties: {
            'building-code': { bsonType: 'string', description: 'must be a string and is required' },
            'building-name': { bsonType: 'string', description: 'must be a string and is required' },
            'total-spaces': { bsonType: ['string', 'number'] },
            'ada-van': { bsonType: ['string', 'number'] },
            'ada-car': { bsonType: ['string', 'number'] },
            latitude: { bsonType: ['string', 'number', 'null'] },
            longitude: { bsonType: ['string', 'number', 'null'] },
            aliases: { bsonType: 'array' },
            contacts: { bsonType: 'array' }
          }
        }
      }
    },
    {
      collection: 'levels',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['_id', 'deckId', 'index', 'name'],
          properties: {
            _id: { bsonType: 'string', description: 'must be a string and is required' },
            deckId: { bsonType: 'string', description: 'must be a string and is required' },
            index: { bsonType: 'number', description: 'must be a number and is required' },
            name: { bsonType: 'string', description: 'must be a string and is required' }
          }
        }
      }
    },
    {
      collection: 'spots',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['_id', 'levelId', 'label', 'status'],
          properties: {
            _id: { bsonType: 'string', description: 'must be a string and is required' },
            levelId: { bsonType: 'string', description: 'must be a string and is required' },
            label: { bsonType: 'string', description: 'must be a string and is required' },
            type: { 
              enum: ['standard', 'ADA', 'EV'],
              description: 'must be one of: standard, ADA, EV'
            },
            status: { 
              enum: ['free', 'occupied', 'reserved', 'maintenance'],
              description: 'must be one of: free, occupied, reserved, maintenance'
            },
            // Optional fields - only present when spot is occupied
            occupiedBy: { 
              bsonType: ['string', 'null'],
              description: 'userId when spot is occupied, null or absent when free'
            },
            occupiedAt: {
              bsonType: ['date', 'null'],
              description: 'timestamp when spot was occupied'
            }
          }
        }
      }
    },
    {
      collection: 'users',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'name', 'password'],
          properties: {
            email: { bsonType: 'string', description: 'must be a string and is required' },
            name: { bsonType: 'string', description: 'must be a string and is required' },
            password: { bsonType: 'string', description: 'must be a string and is required' }
          }
        }
      }
    }
  ]

  for (const { collection, validator } of validators) {
    try {
      // Check if collection exists and has documents
      const collectionInfo = await db.listCollections({ name: collection }).toArray()
      if (collectionInfo.length > 0) {
        const count = await db.collection(collection).countDocuments()
        // Only set validator if collection is empty (to avoid conflicts with existing data)
        if (count === 0) {
          try {
            await db.command({
              collMod: collection,
              validator: validator.$jsonSchema
            })
            console.log(`   Validator set on '${collection}'`)
          } catch (err) {
            // Validator might already exist - this is acceptable
            if (err.code === 13 || err.code === 66) {
              console.log(`   Validator on '${collection}' (already set)`)
            } else {
              console.log(`   Validator on '${collection}': ${err.message}`)
            }
          }
        } else {
          console.log(`   Validator on '${collection}' (skipped - collection has ${count} documents)`)
        }
      }
    } catch (error) {
      // Silently skip validator errors - they're optional
      console.log(`   Validator on '${collection}': ${error.message}`)
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

