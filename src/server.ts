// src/server.ts
import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import booksRoutes from "./routes/booksRoutes.js";
import borrowsRoutes from "./routes/borrowsRoutes.js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  }));
app.use(express.json());

// API Routes
app.use("/api/books", booksRoutes);
app.use("/api/borrows", borrowsRoutes);

// Health Check Route
app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "BookNook Server is running!" });
});

// Initialize DB and Start Server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

startServer();
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import booksRoutes from "./routes/booksRoutes.js";
// dotenv.config();

// const app = express();

// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:3000",
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use("/books", booksRoutes);

// // Health check route
// app.get("/", (_req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Welcome to BookNook API",
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`BookNook server running on port ${PORT}`);
// });
