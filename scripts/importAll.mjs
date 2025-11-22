// scripts/importAll.mjs

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";

// Enable __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (parent directory of scripts/)
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");

console.log(`📁 Looking for .env file at: ${envPath}`);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ Loaded .env file successfully\n");
} else {
  console.error(`❌ .env file not found at: ${envPath}`);
  console.error("Please create a .env file in the project root with MONGODB_URI\n");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "ezpark";

if (!uri) {
  console.error("❌ MONGODB_URI is not set in .env");
  console.error("Please add: MONGODB_URI=mongodb://localhost:27017/ezpark\n");
  process.exit(1);
}

// ------------------- IMPORT LOGIC -------------------

async function importJsonFile(collectionName, filePath, db) {
  console.log(`\n⏳ Importing ${collectionName} from ${filePath}...`);

  let jsonData;

  try {
    jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`❌ Error reading ${filePath}:`, err);
    return;
  }

  const collection = db.collection(collectionName);

  // Clear existing documents
  await collection.deleteMany({});
  console.log(`🧹 Cleared existing ${collectionName} collection.`);

  // Transform data based on collection type
  let data = jsonData;
  
  if (collectionName === 'spots') {
    // Transform spots data to ensure consistency
    data = jsonData.map(spot => ({
      ...spot,
      // Keep original fields: id, levelId, handicap, label, available, user_id
      // Ensure user_id is properly set (empty string or null means free)
      user_id: spot.user_id || null
    }));
    console.log(`📊 Transformed ${data.length} spots (using user_id field for occupancy tracking)`);
  }

  // Insert documents (continue even if some fail)
  try {
    const result = await collection.insertMany(data, { ordered: false });
    console.log(
      `✅ Inserted ${result.insertedCount} records into ${collectionName}`
    );
  } catch (err) {
    console.error(`❌ Insert error in ${collectionName}:`, err.message);
  }
}

// ------------------- MAIN -------------------

async function createIndexes(db) {
  console.log("\n📑 Creating indexes...");
  
  const indexes = [
    // Decks collection
    { collection: 'decks', index: { 'building-code': 1 }, options: { unique: true, name: 'building-code' } },
    { collection: 'decks', index: { 'building-name': 1 }, options: { name: 'building-name' } },
    
    // Levels collection
    { collection: 'levels', index: { deckId: 1 }, options: { name: 'deckId' } },
    { collection: 'levels', index: { id: 1 }, options: { unique: true, name: 'id' } },
    
    // Spots collection - optimized for user_id queries
    { collection: 'spots', index: { levelId: 1 }, options: { name: 'levelId' } },
    { collection: 'spots', index: { id: 1 }, options: { unique: true, name: 'id' } },
    { collection: 'spots', index: { label: 1, levelId: 1 }, options: { unique: true, name: 'label_levelId' } },
    { collection: 'spots', index: { handicap: 1 }, options: { name: 'handicap' } },
    { collection: 'spots', index: { user_id: 1 }, options: { name: 'user_id', sparse: true } },
    { collection: 'spots', index: { available: 1 }, options: { name: 'available' } },
  ];

  for (const { collection, index, options } of indexes) {
    try {
      await db.collection(collection).createIndex(index, options);
      console.log(`   ✅ Created index '${options.name}' on '${collection}'`);
    } catch (err) {
      if (err.code === 85 || err.code === 86) {
        console.log(`   ✓ Index '${options.name}' on '${collection}' already exists`);
      } else {
        console.log(`   ⚠️  Index '${options.name}' on '${collection}': ${err.message}`);
      }
    }
  }
}

async function run() {
  console.log("🔌 Connecting to MongoDB...");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("📦 Connected. Using database:", DB_NAME);

    const db = client.db(DB_NAME);
    const mockFolder = path.join(__dirname, "..", "mockData");

    await importJsonFile("decks", path.join(mockFolder, "decks.json"), db);
    await importJsonFile("levels", path.join(mockFolder, "levels.json"), db);
    await importJsonFile("spots", path.join(mockFolder, "spots.json"), db);

    // Create indexes after importing data
    await createIndexes(db);

    console.log("\n🎉 All data imported successfully!");
  } catch (err) {
    console.error("\n❌ ERROR during import:", err);
  } finally {
    await client.close();
    console.log("🔒 Connection closed.");
  }
}

run();
