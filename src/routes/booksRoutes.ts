
import { Router } from "express";

import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/booksController.js";

const router = Router();

// GET all books
router.get("/", getAllBooks);

// GET one book
router.get("/:id", getBookById);

// ADD book
router.post("/", createBook);

// UPDATE book
router.patch("/:id", updateBook);

// DELETE book
router.delete("/:id", deleteBook);

export default router;
