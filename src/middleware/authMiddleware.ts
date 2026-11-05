
import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Read the JWKS URL from the backend environment.
const jwksUrl = process.env.BETTER_AUTH_JWKS_URL;

if (!jwksUrl) {
  throw new Error("BETTER_AUTH_JWKS_URL is missing");
}

// Create the remote JWKS resolver once, not on every request.
const JWKS = createRemoteJWKSet(new URL(jwksUrl));

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
      return;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Empty token",
      });
      return;
    }

    const issuer = process.env.BETTER_AUTH_ISSUER;
    const audience = process.env.BETTER_AUTH_AUDIENCE;

    if (!issuer || !audience) {
      throw new Error("JWT issuer or audience is missing");
    }

    // Verify the JWT signature and its claims.
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience,
    });

    // Ensure the token contains the required user information.
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    const authenticatedReq = req as AuthenticatedRequest;

    authenticatedReq.user = {
      id: payload.sub,
      email: payload.email,
      name:
        typeof payload.name === "string"
          ? payload.name
          : undefined,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token",
    });
  }
}
