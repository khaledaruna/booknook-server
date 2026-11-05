import type { Request, Response } from "express";
import { ObjectId } from "mongodb";

import { client, getDB } from "../config/db.js";
import { booksCollection, borrowsCollection } from "../config/collections.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

export async function createBorrow(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const { bookId, returnDate } = req.body;

  if (!ObjectId.isValid(bookId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid book ID",
    });
  }

  const dueDate = new Date(returnDate);

  if (!returnDate || Number.isNaN(dueDate.getTime()) || dueDate <= new Date()) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid future return date",
    });
  }

  const session = client.startSession();

  try {
    let createdBorrow: Record<string, unknown> | null = null;

    await session.withTransaction(async () => {
      const books = getDB().collection("books");
      const borrows = getDB().collection("borrows");
      const id = new ObjectId(bookId);

      const book = await books.findOne(
        { _id: id },
        { session }
      );

      if (!book) {
        throw new Error("BOOK_NOT_FOUND");
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
        throw new Error("ALREADY_BORROWED");
      }

      const stockUpdate = await books.updateOne(
        {
          _id: id,
          availableCopies: { $gt: 0 },
        },
        {
          $inc: { availableCopies: -1 },
        },
        { session }
      );

      if (stockUpdate.modifiedCount !== 1) {
        throw new Error("OUT_OF_STOCK");
      }

      const borrow = {
        bookId: id,
        bookTitle: book.title,
        bookImage: book.image,
        userEmail: user.email.toLowerCase(),
        borrowDate: new Date(),
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

    return res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: createdBorrow,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "BOOK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (message === "ALREADY_BORROWED") {
      return res.status(409).json({
        success: false,
        message: "You already have an active borrow for this book",
      });
    }

    if (message === "OUT_OF_STOCK") {
      return res.status(409).json({
        success: false,
        message: "No copies are currently available",
      });
    }

    console.error("Create borrow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to borrow book",
    });
  } finally {
    await session.endSession();
  }
}

export async function getMyBorrows(req: Request, res: Response) {
  try {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const borrows = await borrowsCollection()
      .find({ userEmail: user.email.toLowerCase() })
      .sort({ borrowDate: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Borrow records retrieved successfully",
      data: borrows,
    });
  } catch (error) {
    console.error("Get borrows error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve borrow records",
    });
  }
}

export async function returnBorrow(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (!ObjectId.isValid(String(req.params.id))) {
    return res.status(400).json({
      success: false,
      message: "Invalid borrow ID",
    });
  }

  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const borrows = getDB().collection("borrows");
      const books = getDB().collection("books");

      const borrowId = new ObjectId(String(req.params.id));

      const borrow = await borrows.findOne(
        {
          _id: borrowId,
          userEmail: user.email.toLowerCase(),
          returned: false,
        },
        { session }
      );

      if (!borrow) {
        throw new Error("BORROW_NOT_FOUND");
      }

      const result = await borrows.updateOne(
        {
          _id: borrowId,
          returned: false,
        },
        {
          $set: { returned: true },
        },
        { session }
      );

      if (result.modifiedCount !== 1) {
        throw new Error("ALREADY_RETURNED");
      }

      await books.updateOne(
        { _id: borrow.bookId },
        { $inc: { availableCopies: 1 } },
        { session }
      );
    });

    return res.status(200).json({
      success: true,
      message: "Book returned successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "BORROW_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Active borrow not found",
      });
    }

    if (message === "ALREADY_RETURNED") {
      return res.status(409).json({
        success: false,
        message: "This book has already been returned",
      });
    }

    console.error("Return book error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to return book",
    });
  } finally {
    await session.endSession();
  }
}