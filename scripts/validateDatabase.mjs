// scripts/validateDatabase.mjs
// Validates that the database is properly set up and data relationships are correct

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

async function validate() {
  console.log("🔍 Validating database structure...\n");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(DB_NAME);

    // 1. Validate Decks
    console.log("\n📦 Validating Decks:");
    const deckCount = await db.collection("decks").countDocuments();
    const sampleDeck = await db.collection("decks").findOne();
    console.log(`   Total decks: ${deckCount}`);
    console.log(`   Sample deck structure:`, {
      _id: sampleDeck?._id,
      "building-code": sampleDeck?.["building-code"],
      "building-name": sampleDeck?.["building-name"],
    });

    // 2. Validate Levels
    console.log("\n📊 Validating Levels:");
    const levelCount = await db.collection("levels").countDocuments();
    const sampleLevel = await db.collection("levels").findOne();
    console.log(`   Total levels: ${levelCount}`);
    console.log(`   Sample level structure:`, {
      _id: sampleLevel?._id,
      id: sampleLevel?.id,
      deckId: sampleLevel?.deckId,
      name: sampleLevel?.name,
    });

    // 3. Validate Spots
    console.log("\n🅿️  Validating Spots:");
    const spotCount = await db.collection("spots").countDocuments();
    const sampleSpot = await db.collection("spots").findOne();
    console.log(`   Total spots: ${spotCount}`);
    console.log(`   Sample spot structure:`, {
      _id: sampleSpot?._id,
      id: sampleSpot?.id,
      levelId: sampleSpot?.levelId,
      label: sampleSpot?.label,
      handicap: sampleSpot?.handicap,
      available: sampleSpot?.available,
      user_id: sampleSpot?.user_id,
    });

    // 4. Validate Relationships
    console.log("\n🔗 Validating Relationships:");

    // Check deck -> levels relationship
    const firstDeck = await db.collection("decks").findOne();
    if (firstDeck) {
      const deckCode = firstDeck["building-code"];
      const levelsForDeck = await db
        .collection("levels")
        .find({ deckId: deckCode })
        .toArray();
      console.log(
        `   Deck "${firstDeck["building-name"]}" (${deckCode}) has ${levelsForDeck.length} levels`
      );

      // Check level -> spots relationship
      if (levelsForDeck.length > 0) {
        const firstLevel = levelsForDeck[0];
        const spotsForLevel = await db
          .collection("spots")
          .find({ levelId: firstLevel.id })
          .toArray();
        console.log(
          `   Level "${firstLevel.name}" (id: ${firstLevel.id}) has ${spotsForLevel.length} spots`
        );
      }
    }

    // 5. Validate Spot States
    console.log("\n🎯 Validating Spot States:");
    const totalSpots = await db.collection("spots").countDocuments();
    const freeSpots = await db
      .collection("spots")
      .countDocuments({ $or: [{ user_id: null }, { user_id: "" }] });
    const occupiedSpots = await db
      .collection("spots")
      .countDocuments({ 
        user_id: { $nin: [null, ""] }
      });
    console.log(`   Total spots: ${totalSpots}`);
    console.log(`   Free spots: ${freeSpots}`);
    console.log(`   Occupied spots: ${occupiedSpots}`);

    // 6. Validate Indexes
    console.log("\n📑 Validating Indexes:");
    const spotIndexes = await db.collection("spots").indexes();
    const requiredIndexes = ["levelId", "user_id", "handicap", "available"];
    const hasAllIndexes = requiredIndexes.every((idx) =>
      spotIndexes.some((i) => i.name === idx)
    );
    console.log(`   Required indexes present: ${hasAllIndexes ? "✅" : "❌"}`);
    spotIndexes.forEach((idx) => {
      console.log(`   - ${idx.name}`);
    });

    // 7. Validate Handicap Spots
    console.log("\n♿ Validating ADA/Handicap Spots:");
    const handicapSpots = await db
      .collection("spots")
      .countDocuments({ handicap: true });
    console.log(`   Total handicap spots: ${handicapSpots}`);

    // 8. Test Aggregation Query (Availability)
    console.log("\n🔢 Testing Aggregation Query:");
    if (sampleLevel) {
      const result = await db
        .collection("spots")
        .aggregate([
          { $match: { levelId: sampleLevel.id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              free: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$user_id", null] },
                        { $eq: ["$user_id", ""] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
        .toArray();

      if (result.length > 0) {
        console.log(
          `   Level "${sampleLevel.name}" availability: ${result[0].free}/${result[0].total} free`
        );
      }
    }

    console.log("\n✅ Validation complete!");
    console.log("\n📝 Summary:");
    console.log(`   ✓ ${deckCount} decks imported`);
    console.log(`   ✓ ${levelCount} levels imported`);
    console.log(`   ✓ ${spotCount} total spots`);
    console.log(`   ${freeSpots === spotCount ? '✓' : '⚠️'}  ${freeSpots} spots are free`);
    console.log(`   ${occupiedSpots === 0 ? '✓' : '⚠️'}  ${occupiedSpots} spots are occupied`);
    console.log(`   ✓ ${handicapSpots} ADA/handicap spots`);
    console.log(
      `   ${hasAllIndexes ? "✓" : "✗"} All required indexes present`
    );

    // Validate counts make sense
    if (freeSpots + occupiedSpots !== spotCount) {
      console.log(`\n⚠️  WARNING: Free (${freeSpots}) + Occupied (${occupiedSpots}) ≠ Total (${spotCount})`);
      console.log("   This indicates a data inconsistency. Some spots may have invalid user_id values.");
    }

    if (occupiedSpots === 0) {
      console.log(
        "\n💡 Note: All spots are currently free. Use the app to check in to spots."
      );
    }
    
    if (!hasAllIndexes) {
      console.log(
        "\n💡 Tip: Start the backend server to create all indexes automatically."
      );
    }
  } catch (err) {
    console.error("\n❌ Validation failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔒 Connection closed.");
  }
}

validate();

