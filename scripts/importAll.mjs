// scripts/importAll.mjs

import "dotenv/config";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";

// Enable __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "ezpark";

if (!uri) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

// ------------------- UTILITIES -------------------

// Remove duplicates by a key (before inserting)
function removeDuplicatesByKey(arr, key) {
  const seen = new Set();
  return arr.filter((obj) => {
    const value = obj[key] ?? null; // treat undefined as null
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
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

  // Fix duplicates and transform where needed
  let data = jsonData;

  if (collectionName === "decks") {
    // Ensure no duplicate "building-name"
    data = removeDuplicatesByKey(jsonData, "building-name");

    // Transform decks to app schema
    data = data.map((d) => ({
      _id: d["building-code"],
      name: d["building-name"] ?? "Unknown Deck",
      address: `${d.ADDRESS1 ?? ""}, ${d.CITY_ID ?? ""}, ${
        d.STATE_ID ?? ""
      } ${d.ZIP ?? ""}`.trim(),
      geo: {
        lat: parseFloat(d.latitude) || 0,
        lng: parseFloat(d.longitude) || 0,
      },
      totalSpaces: parseInt(d["total-spaces"] || 0),
      adaVan: parseInt(d["ada-van"] || 0),
      adaCar: parseInt(d["ada-car"] || 0),
      aliases: d.aliases || [],
      contacts: d.contacts || [],
    }));
  }

  if (collectionName === "levels") {
    data = jsonData.map((lvl) => ({
      _id: lvl["_id"] ?? lvl.id ?? `${lvl.deckId}_${lvl.index}`,
      deckId: lvl.deckId,
      index: lvl.index,
      name: lvl.name ?? `Level ${lvl.index}`,
    }));
  }

  if (collectionName === "spots") {
    data = removeDuplicatesByKey(jsonData, "_id");
    data = data.map((s) => ({
      _id: s._id,
      levelId: s.levelId,
      label: s.label,
      type: s.type ?? "standard",
      status: s.status ?? "free",
    }));
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

    console.log("\n🎉 All data imported successfully!");
  } catch (err) {
    console.error("\n❌ ERROR during import:", err);
  } finally {
    await client.close();
    console.log("🔒 Connection closed.");
  }
}

run();
