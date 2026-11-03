import { Collection, ObjectId } from "mongodb";
import { getDB } from "../config/db.js"; // Adjust path to your db connection file
import { Book, BorrowRecord } from "../types/book.types.js";

// Helper to get the collections safely
export function getBooksCollection(): Collection<Book> {
  const db = getDB();
  return db.collection<Book>("books");
}

export function getBorrowsCollection(): Collection<BorrowRecord> {
  const db = getDB();
  return db.collection<BorrowRecord>("borrows");
}

// --- BOOK HELPERS ---

// 1. Fetch latest books for Home Page New Arrivals (limit 6, sorted newest first)
export async function getLatestBooks(): Promise<Book[]> {
  const booksCollection = getBooksCollection();
  return await booksCollection
    .find({})
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();
}

// 2. Find a single book by ID
export async function getBookById(id: string): Promise<Book | null> {
  const booksCollection = getBooksCollection();
  if (!ObjectId.isValid(id)) return null;
  return await booksCollection.findOne({ _id: new ObjectId(id) });
}

// 3. Add a new book
export async function insertBook(bookData: Omit<Book, "_id" | "createdAt">): Promise<any> {
  const booksCollection = getBooksCollection();
  return await booksCollection.insertOne({
    ...bookData,
    createdAt: new Date(),
  });
}

// 4. Update an existing book (owner only)
export async function updateBookById(id: string, updateData: Partial<Book>): Promise<any> {
  const booksCollection = getBooksCollection();
  if (!ObjectId.isValid(id)) return null;
  return await booksCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  );
}

// 5. Delete a book
export async function deleteBookById(id: string): Promise<any> {
  const booksCollection = getBooksCollection();
  if (!ObjectId.isValid(id)) return null;
  return await booksCollection.deleteOne({ _id: new ObjectId(id) });
}


// --- BORROW HELPERS ---

// 1. Insert a borrow record
export async function insertBorrowRecord(borrowData: Omit<BorrowRecord, "_id">): Promise<any> {
  const borrowsCollection = getBorrowsCollection();
  return await borrowsCollection.insertOne(borrowData);
}

// 2. Get all borrows for a specific user email
export async function getBorrowsByUserEmail(email: string): Promise<BorrowRecord[]> {
  const borrowsCollection = getBorrowsCollection();
  return await borrowsCollection.find({ userEmail: email }).toArray();
}

// 3. Delete / Return a borrow record by ID
export async function deleteBorrowById(id: string): Promise<any> {
  const borrowsCollection = getBorrowsCollection();
  if (!ObjectId.isValid(id)) return null;
  return await borrowsCollection.deleteOne({ _id: new ObjectId(id) });
}