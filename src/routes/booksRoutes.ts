
import { Router } from "express";
import {
  getAllBooks,
  getBookById,
} from "../controllers/booksController.js";

const router = Router();

router.get("/", getAllBooks);
router.get("/:id", getBookById);

export default router;
