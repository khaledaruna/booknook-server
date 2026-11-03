import "dotenv/config"; // Must be absolute top to load env variables first
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import booksRoutes from "./routes/booksRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/books", booksRoutes);

// Health check route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to BookNook API",
  });
});

// Start server after successful database connection
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`BookNook server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
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
