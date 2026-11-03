
import "dotenv/config";
import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || "booknook";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(MONGODB_URI);

let database: Db | null = null;

export async function connectDB(): Promise<Db> {
  try {
    if (database) {
      return database;
    }

    await client.connect();

    database = client.db(DATABASE_NAME);

    await database.command({ ping: 1 });

    console.log("MongoDB connected successfully!");

    return database;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

export function getDB(): Db {
  if (!database) {
    throw new Error("Database is not connected yet");
  }

  return database;
}

export { client };