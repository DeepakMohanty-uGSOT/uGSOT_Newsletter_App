import { verifyAuthToken } from "../lib/authToken";
import { AUTH_COOKIE_NAME } from "../lib/authCookie";
export function requireAuth(req, res, next) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        res.status(500).json({ error: "Server misconfigured: missing SESSION_SECRET" });
        return;
    }
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    const payload = verifyAuthToken(token, secret);
    if (!payload) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }
    req.adminEmail = payload.email;
    next();
}
