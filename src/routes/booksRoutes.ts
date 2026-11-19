import { Router, type Request, type Response, type NextFunction } from "express";
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/booksController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public by default; authenticates when ?mine=true
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    if (req.query.mine === "true") {
      requireAuth(req, res, next);
      return;
    }
    next();
  },
  getAllBooks
);

// Public single book route
router.get("/:id", getBookById);

// Protected routes
router.post("/", requireAuth, createBook);
router.patch("/:id", requireAuth, updateBook);
router.delete("/:id", requireAuth, deleteBook);

export default router;