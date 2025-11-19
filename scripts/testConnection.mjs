import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ezpark";

if (!uri) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  console.log("Connecting to MongoDB...");
  await client.connect();
  console.log("SUCCESS! Connected to MongoDB");

  if (dbName) {
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`Using database: ${dbName}`);
    console.log(
      "Collections:",
      collections.map((c) => c.name)
    );
  }
} catch (err) {
  console.error("FAIL:", err);
} finally {
  await client.close();
  console.log("Connection closed.");
}
