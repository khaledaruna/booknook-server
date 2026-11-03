import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";

// Extend Express Request interface to include user property
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const secret = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET || "your_fallback_secret");

    // Verify token using jose
    const { payload } = await jwtVerify(token, secret);
    
    // Attach user data to request object
    req.user = {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
}