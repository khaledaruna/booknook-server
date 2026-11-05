import { Router } from "express";

import {
  createBorrow,
  getMyBorrows,
  returnBorrow,
} from "../controllers/borrowsController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", createBorrow);
router.get("/", getMyBorrows);
router.delete("/:id", returnBorrow);

export default router;