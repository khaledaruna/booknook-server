import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import type { Book, BookCategory } from "../types/book.types.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";
import {
  getAllBooks as fetchAllBooks,
  getBookById as fetchBookById,
  insertBook,
  updateBookByIdAndOwner,
  deleteBookByIdAndOwner,
} from "../models/bookModels.js";

const categoryEnum = z.enum(["Fiction", "Science", "History", "Kids", "Others"]);

const booksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(100),
  category: categoryEnum.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  mine: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
});

const createBookSchema = z.object({
  title: z.string().trim().min(2).max(150),
  author: z.string().trim().min(2).max(100),
  category: categoryEnum,
  image: z.string().trim().url().max(2048),
  description: z.string().trim().min(20).max(2000),
  totalCopies: z.coerce.number().int().min(1).max(1000),
});

const updateBookSchema = createBookSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one book field is required");

// ========================================
// GET ALL BOOKS
// ========================================
export const getAllBooks = asyncHandler(async (req: Request, res: Response) => {
  const parsed = booksQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    throw createHttpError(400, "Invalid books query parameters");
  }

  const { category, limit, mine, search } = parsed.data;
  const user = (req as AuthenticatedRequest).user;

  if (mine && !user) {
    throw createHttpError(401, "Authentication is required");
  }

  const books = await fetchAllBooks({
    category,
    search,
    limit,
    ownerEmail: mine ? user!.email : undefined,
  });

  res.status(200).json({
    success: true,
    message: "Books retrieved successfully",
    data: books,
  });
});

// ========================================
// GET SINGLE BOOK
// ========================================
export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  if (!ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid book ID");
  }

  const book = await fetchBookById(id);

  if (!book) {
    throw createHttpError(404, "Book not found");
  }

  res.status(200).json({
    success: true,
    message: "Book retrieved successfully",
    data: book,
  });
});

// ========================================
// ADD NEW BOOK
// ========================================
export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  const parsed = createBookSchema.safeParse(req.body);

  if (!parsed.success) {
    throw createHttpError(400, "Invalid book data");
  }

  const now = new Date();
  const bookData: Omit<Book, "_id"> = {
    ...parsed.data,
    category: parsed.data.category as BookCategory,
    availableCopies: parsed.data.totalCopies,
    addedBy: {
      userId: user.id,
      name: user.name || "BookNook User",
      email: user.email.trim().toLowerCase(),
    },
    addedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await insertBook(bookData);

  res.status(201).json({
    success: true,
    message: "Book added successfully",
    data: {
      _id: result.insertedId,
      ...bookData,
    },
  });
});

// ========================================
// UPDATE BOOK
// ========================================
export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  const id = String(req.params.id);

  if (!ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid book ID");
  }

  const parsed = updateBookSchema.safeParse(req.body);

  if (!parsed.success) {
    throw createHttpError(400, "Invalid book data");
  }

  const existingBook = await fetchBookById(id);

  if (
    !existingBook ||
    existingBook.addedBy?.email?.toLowerCase() !== user.email.toLowerCase()
  ) {
    throw createHttpError(404, "Book not found or not owned by you");
  }

  const updateData: Partial<Book> = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  if (parsed.data.totalCopies !== undefined) {
    const borrowedCopies = existingBook.totalCopies - existingBook.availableCopies;

    if (parsed.data.totalCopies < borrowedCopies) {
      throw createHttpError(
        400,
        "Total copies cannot be less than currently borrowed copies"
      );
    }

    updateData.availableCopies = parsed.data.totalCopies - borrowedCopies;
  }

  const result = await updateBookByIdAndOwner(id, user.email, updateData);

  if (!result || result.matchedCount === 0) {
    throw createHttpError(404, "Book not found or not owned by you");
  }

  const updatedBook = await fetchBookById(id);

  res.status(200).json({
    success: true,
    message: "Book updated successfully",
    data: updatedBook,
  });
});

// ========================================
// DELETE BOOK
// ========================================
export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  const id = String(req.params.id);

  if (!ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid book ID");
  }

  const result = await deleteBookByIdAndOwner(id, user.email);

  if (!result) {
    throw createHttpError(400, "Invalid book ID");
  }

  if ("blocked" in result && result.blocked) {
    throw createHttpError(409, "Cannot delete a book while it has active borrows");
  }

  if ("deletedCount" in result && result.deletedCount === 0) {
    throw createHttpError(404, "Book not found or not owned by you");
  }

  res.status(200).json({
    success: true,
    message: "Book deleted successfully",
  });
});