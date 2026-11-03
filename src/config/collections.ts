
import { Collection } from "mongodb";

import { getDB } from "./db.js";

import type { Book } from "../types/book.types.js";

import type { Borrow } from "../types/borrow.types.js";

export const booksCollection = (): Collection<Book> => {
  return getDB().collection<Book>("books");
};

export const borrowsCollection = (): Collection<Borrow> => {
  return getDB().collection<Borrow>("borrows");
};
