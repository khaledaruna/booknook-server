
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { booksCollection } from "../config/collections.js";

// GET: Retrieve all books
export const getAllBooks = async (_req: Request, res: Response) => {
  try {
    const books = await booksCollection()
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Books retrieved successfully",
      data: books,
    });
  } catch (error) {
    console.error("Get all books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
    });
  }
};

// GET: Retrieve a single book
export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    const book = await booksCollection().findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book retrieved successfully",
      data: book,
    });
  } catch (error) {
    console.error("Get book by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve book",
    });
  }
};
