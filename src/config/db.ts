import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.MONGODB_URI;

if (!connectionString) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

const client = new MongoClient(connectionString);
let dbInstance: Db;

export async function connectDB(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    await client.connect();

    const databaseName = process.env.DATABASE_NAME || "booknook";
    dbInstance = client.db(databaseName);

    console.log("Successfully connected to MongoDB");

    return dbInstance;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call connectDB first.");
  }

  return dbInstance;
}

export { client };
