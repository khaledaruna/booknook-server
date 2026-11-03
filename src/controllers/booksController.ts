
import type { Request, Response } from "express";
import type { Book, BookCategory } from "../types/book.types.js";
import {
  getAllBooks as fetchAllBooks,
  getBookById as fetchBookById,
  insertBook,
  updateBookById,
  deleteBookById,
} from "../models/bookModels.js";

import type { BookCategory } from "../types/book.types.js";

const categories: BookCategory[] = [
  "Fiction",
  "Science",
  "History",
  "Kids",
  "Others",
];

// ========================================
// GET ALL BOOKS
// ========================================

export const getAllBooks = async (_req: Request, res: Response) => {
  try {
    const books = await fetchAllBooks();

    res.status(200).json({
      success: true,
      message: "Books retrieved successfully",
      data: books,
    });
  } catch (error) {
    console.error("Get books error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve books",
    });
  }
};

// ========================================
// GET SINGLE BOOK
// ========================================

export const getBookById = async (req: Request, res: Response) => {
  try {
    const book = await fetchBookById(req.params.id);

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found or invalid ID",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book retrieved successfully",
      data: book,
    });
  } catch (error) {
    console.error("Get book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve book",
    });
  }
};

// ========================================
// ADD NEW BOOK
// ========================================

export const createBook = async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      category,
      image,
      description,
      addedBy,
      totalCopies,
    } = req.body;

    if (
      !title ||
      !author ||
      !category ||
      !image ||
      !description ||
      !addedBy?.name ||
      !addedBy?.email ||
      !Number.isInteger(totalCopies) ||
      totalCopies < 1
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required book information",
      });
      return;
    }

    if (!categories.includes(category)) {
      res.status(400).json({
        success: false,
        message: "Invalid book category",
      });
      return;
    }

    const bookData = {
      title: title.trim(),
      author: author.trim(),
      category: category as BookCategory,
      image: image.trim(),
      description: description.trim(),
      addedBy: {
        name: addedBy.name.trim(),
        email: addedBy.email.trim().toLowerCase(),
      },
      totalCopies,
      availableCopies: totalCopies,
    };

    const result = await insertBook(bookData);

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: {
        insertedId: result.insertedId,
        ...bookData,
      },
    });
  } catch (error) {
    console.error("Create book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
};

// ========================================
// UPDATE BOOK
// ========================================

export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingBook = await fetchBookById(id);

    if (!existingBook) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    const {
      title,
      author,
      category,
      image,
      description,
      totalCopies,
    } = req.body;

    // Only allow these fields to be updated.
    const updateData: Pattial<Book> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid book title",
        });
        return;
      }

      updateData.title = title.trim();
    }

    if (author !== undefined) {
      if (typeof author !== "string" || !author.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid author name",
        });
        return;
      }

      updateData.author = author.trim();
    }

    if (category !== undefined) {
      if (!categories.includes(category)) {
        res.status(400).json({
          success: false,
          message: "Invalid book category",
        });
        return;
      }

      updateData.category = category;
    }

    if (image !== undefined) {
      if (typeof image !== "string" || !image.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid image URL",
        });
        return;
      }

      updateData.image = image.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        res.status(400).json({
          success: false,
          message: "Invalid description",
        });
        return;
      }

      updateData.description = description.trim();
    }

    if (totalCopies !== undefined) {
      if (!Number.isInteger(totalCopies) || totalCopies < 1) {
        res.status(400).json({
          success: false,
          message: "Total copies must be a positive whole number",
        });
        return;
      }

      const borrowedCopies =
        existingBook.totalCopies - existingBook.availableCopies;

      if (totalCopies < borrowedCopies) {
        res.status(400).json({
          success: false,
          message: "Total copies cannot be less than currently borrowed copies",
        });
        return;
      }

      updateData.totalCopies = totalCopies;
      updateData.availableCopies = totalCopies - borrowedCopies;
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        message: "No valid update information provided",
      });
      return;
    }

    const result = await updateBookById(id, updateData);

    if (!result || result.matchedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    const updatedBook = await fetchBookById(id);

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    console.error("Update book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
};

// ========================================
// DELETE BOOK
// ========================================

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const result = await deleteBookById(req.params.id);

    if (!result) {
      res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
      return;
    }

    if ("blocked" in result && result.blocked) {
      res.status(409).json({
        success: false,
        message: "Cannot delete a book while it has active borrows",
      });
      return;
    }

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete book error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
};
