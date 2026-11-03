
import { ObjectId } from "mongodb";

import { booksCollection, borrowsCollection } from "../config/collections.js";

import type { Book } from "../types/book.types.js";
import type { Borrow } from "../types/borrow.types.js";

// ========================================
// BOOK DATABASE OPERATIONS
// ========================================

// Get all books
export async function getAllBooks(): Promise<Book[]> {
  return await booksCollection()
    .find()
    .sort({ createdAt: -1 })
    .toArray();
}

// Get latest 6 books for homepage
export async function getLatestBooks(): Promise<Book[]> {
  return await booksCollection()
    .find()
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();
}

// Get one book by ID
export async function getBookById(id: string): Promise<Book | null> {
  if (!ObjectId.isValid(id)) return null;

  return await booksCollection().findOne({
    _id: new ObjectId(id),
  });
}

// Add a book
export async function insertBook(
  bookData: Omit<Book, "_id" | "createdAt" | "updatedAt">
) {
  const now = new Date();

  return await booksCollection().insertOne({
    ...bookData,
    createdAt: now,
    updatedAt: now,
  });
}

// Update a book
export async function updateBookById(
  id: string,
  updateData: Partial<Book>
) {
  if (!ObjectId.isValid(id)) return null;

  return await booksCollection().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    }
  );
}

// Delete a book
export async function deleteBookById(id: string) {
  if (!ObjectId.isValid(id)) return null;

  const bookObjectId = new ObjectId(id);

  // Prevent deleting a book with an active borrow
  const activeBorrow = await borrowsCollection().findOne({
    bookId: bookObjectId,
    returned: false,
  });

  if (activeBorrow) {
    return { blocked: true };
  }

  return await booksCollection().deleteOne({
    _id: bookObjectId,
  });
}

// ========================================
// BORROW DATABASE OPERATIONS
// ========================================

// Insert borrow record
export async function insertBorrowRecord(
  borrowData: Omit<Borrow, "_id">
) {
  return await borrowsCollection().insertOne(borrowData);
}

// Get borrows for a user
export async function getBorrowsByUserEmail(
  email: string
): Promise<Borrow[]> {
  return await borrowsCollection()
    .find({ userEmail: email })
    .sort({ borrowDate: -1 })
    .toArray();
}

// Find borrow by ID
export async function getBorrowById(id: string) {
  if (!ObjectId.isValid(id)) return null;

  return await borrowsCollection().findOne({
    _id: new ObjectId(id),
  });
}

// Delete borrow record
export async function deleteBorrowById(id: string) {
  if (!ObjectId.isValid(id)) return null;

  return await borrowsCollection().deleteOne({
    _id: new ObjectId(id),
  });
}
