import type { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../lib/authToken";
import { AUTH_COOKIE_NAME } from "../lib/authCookie";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfigured: missing SESSION_SECRET" });
    return;
  }

  const token = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE_NAME];
  const payload = verifyAuthToken(token, secret);

  if (!payload) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  (req as Request & { adminEmail?: string }).adminEmail = payload.email;
  next();
}
