// Park EZ database setup

// 1) Use or create the database
use('ezpark')

// 2) Create all collections if they do not exist
const collections = [
  'decks',
  'levels',
  'spots',
  'spotSessions',
  'spotStateHistory',
  'users',
  'spotReports',
]

const existing = db.getCollectionNames()

collections.forEach(name => {
  if (!existing.includes(name)) {
    db.createCollection(name)
    print(`Created collection: ${name}`)
  } else {
    print(`Collection already exists: ${name}`)
  }
})

// 3) Indexes

// Decks - one entry per physical deck
db.decks.createIndex(
  { name: 1 },
  { unique: true, name: 'name' },
)

// Levels - levels inside each deck
db.levels.createIndex(
  { deckId: 1, index: 1 },
  { name: 'deckId_index' },
)
db.levels.createIndex(
  { deckId: 1 },
  { name: 'deckId' },
)

// Spots - individual parking spots
db.spots.createIndex(
  { levelId: 1 },
  { name: 'levelId' },
)
db.spots.createIndex(
  { levelId: 1, label: 1 },
  { unique: true, name: 'levelId_label' },
)

// Spot sessions - active or past check in sessions
db.spotSessions.createIndex(
  { userId: 1 },
  { name: 'userId' },
)
db.spotSessions.createIndex(
  { spotId: 1 },
  { name: 'spotId' },
)
db.spotSessions.createIndex(
  { startedAt: -1 },
  { name: 'startedAt_desc' },
)

// Spot state history - timeline of state changes for a spot
db.spotStateHistory.createIndex(
  { spotId: 1 },
  { name: 'spotId' },
)
db.spotStateHistory.createIndex(
  { spotId: 1, at: -1 },
  { name: 'spotId_at_desc' },
)

// Users - app users
db.users.createIndex(
  { email: 1 },
  { unique: true, name: 'email' },
)

// Spot reports - incorrect status reports from users
db.spotReports.createIndex(
  { spotId: 1 },
  { name: 'spotId' },
)
db.spotReports.createIndex(
  { createdAt: -1 },
  { name: 'createdAt_desc' },
)

'Done'
