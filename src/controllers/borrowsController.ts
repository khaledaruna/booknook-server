import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { client, getDB } from "../config/db.js";
import { borrowsCollection } from "../config/collections.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createHttpError } from "../utils/httpError.js";

const borrowSchema = z.object({
  bookId: z.string().refine(ObjectId.isValid, "Invalid book ID"),
  returnDate: z.string().optional(),
});

export const createBorrow = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  const parsed = borrowSchema.safeParse(req.body);

  if (!parsed.success) {
    throw createHttpError(400, "Invalid borrow data");
  }

  const { bookId, returnDate } = parsed.data;
  const borrowDate = new Date();
  const dueDate = returnDate
    ? new Date(returnDate)
    : new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(dueDate.getTime()) || dueDate <= borrowDate) {
    throw createHttpError(400, "Please select a valid future return date");
  }

  const session = client.startSession();

  try {
    let createdBorrow: Record<string, unknown> | null = null;

    await session.withTransaction(async () => {
      const books = getDB().collection("books");
      const borrows = getDB().collection("borrows");
      const id = new ObjectId(bookId);

      const book = await books.findOne({ _id: id }, { session });

      if (!book) {
        throw createHttpError(404, "Book not found");
      }

      const existingBorrow = await borrows.findOne(
        {
          bookId: id,
          userEmail: user.email.toLowerCase(),
          returned: false,
        },
        { session }
      );

      if (existingBorrow) {
        throw createHttpError(409, "You have already borrowed this book");
      }

      const stockUpdate = await books.updateOne(
        { _id: id, availableCopies: { $gt: 0 } },
        { $inc: { availableCopies: -1 } },
        { session }
      );

      if (stockUpdate.modifiedCount !== 1) {
        throw createHttpError(409, "This book is not available");
      }

      const borrow = {
        bookId: id,
        bookTitle: book.title,
        bookImage: book.image,
        userEmail: user.email.toLowerCase(),
        userName: user.name || "BookNook User",
        borrowDate,
        returnDate: dueDate,
        returned: false,
        createdAt: new Date(),
      };

      const result = await borrows.insertOne(borrow, { session });

      createdBorrow = {
        _id: result.insertedId,
        ...borrow,
      };
    });

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: createdBorrow,
    });
  } finally {
    await session.endSession();
  }
});

export const getMyBorrows = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  const borrows = await borrowsCollection()
    .find({ userEmail: user.email.toLowerCase() })
    .sort({ borrowDate: -1 })
    .toArray();

  res.status(200).json({
    success: true,
    message: "Borrow records retrieved successfully",
    data: borrows,
  });
});

export const returnBorrow = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  const id = String(req.params.id);

  if (!ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid borrow ID");
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const borrows = getDB().collection("borrows");
      const books = getDB().collection("books");
      const borrowId = new ObjectId(id);

      const borrow = await borrows.findOne(
        {
          _id: borrowId,
          userEmail: user.email.toLowerCase(),
          returned: false,
        },
        { session }
      );

      if (!borrow) {
        throw createHttpError(404, "Borrow record not found");
      }

      const result = await borrows.updateOne(
        { _id: borrowId, returned: false },
        { $set: { returned: true } },
        { session }
      );

      if (result.modifiedCount !== 1) {
        throw createHttpError(409, "This book has already been returned");
      }

      await books.updateOne(
        { _id: borrow.bookId },
        { $inc: { availableCopies: 1 } },
        { session }
      );
    });

    res.status(200).json({
      success: true,
      message: "Book returned successfully",
    });
  } finally {
    await session.endSession();
  }
});