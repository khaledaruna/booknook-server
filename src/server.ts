import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { client, connectDB } from "./config/db.js";
import booksRoutes from "./routes/booksRoutes.js";
import borrowsRoutes from "./routes/borrowsRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());

// Health Check Route
app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "BookNook Server is running!" });
});

// API Routes
app.use("/books", booksRoutes);
app.use("/borrows", borrowsRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize DB and Start Server
async function startServer() {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    async function shutdown(signal: string) {
      console.log(`${signal} received; shutting down`);
      server.close(async () => {
        await client.close();
        process.exit(0);
      });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();