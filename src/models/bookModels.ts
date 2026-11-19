import { ObjectId, type Filter } from "mongodb";
import { booksCollection, borrowsCollection } from "../config/collections.js";
import type { Book } from "../types/book.types.js";

export interface BookQueryOptions {
  category?: string;
  search?: string;
  ownerEmail?: string;
  limit?: number;
}

export async function getAllBooks(options: BookQueryOptions = {}) {
  const filter: Filter<Book> = {};

  if (options.ownerEmail) {
    filter["addedBy.email"] = options.ownerEmail.toLowerCase();
  }

  if (options.category) {
    filter.category = options.category as Book["category"];
  }

  if (options.search) {
    const escapedSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: escapedSearch, $options: "i" } },
      { author: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  return booksCollection()
    .find(filter)
    .sort({ addedAt: -1, _id: -1 })
    .limit(options.limit ?? 100)
    .toArray();
}

export async function getBookById(id: string) {
  if (!ObjectId.isValid(id)) return null;
  return booksCollection().findOne({ _id: new ObjectId(id) });
}

export async function insertBook(bookData: Omit<Book, "_id">) {
  return booksCollection().insertOne(bookData as Book);
}

export async function updateBookByIdAndOwner(
  id: string,
  ownerEmail: string,
  updateData: Partial<Book>
) {
  if (!ObjectId.isValid(id)) return null;

  return booksCollection().updateOne(
    {
      _id: new ObjectId(id),
      "addedBy.email": ownerEmail.toLowerCase(),
    },
    { $set: updateData }
  );
}

export async function deleteBookByIdAndOwner(id: string, ownerEmail: string) {
  if (!ObjectId.isValid(id)) return null;

  const bookId = new ObjectId(id);

  // Prevent deleting a book that still has active borrows
  const activeBorrow = await borrowsCollection().findOne({
    bookId,
    returned: false,
  });

  if (activeBorrow) {
    return { blocked: true as const };
  }

  return booksCollection().deleteOne({
    _id: bookId,
    "addedBy.email": ownerEmail.toLowerCase(),
  });
}
