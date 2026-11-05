import { Router } from "express";

import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/booksController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public route: anyone can see all books
router.get("/", getAllBooks);

// Private routes: login required
router.get("/:id", requireAuth, getBookById);
router.post("/", requireAuth, createBook);
router.patch("/:id", requireAuth, updateBook);
router.delete("/:id", requireAuth, deleteBook);

export default router;