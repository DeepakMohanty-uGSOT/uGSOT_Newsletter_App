import { createHmac, timingSafeEqual } from "node:crypto";
function base64UrlEncode(input) {
    return Buffer.from(input, "utf8").toString("base64url");
}
function base64UrlDecode(input) {
    return Buffer.from(input, "base64url").toString("utf8");
}
function sign(payload, secret) {
    return createHmac("sha256", secret).update(payload).digest("base64url");
}
export function signAuthToken(email, secret, ttlMs = 7 * 24 * 60 * 60 * 1000) {
    const payload = { email, exp: Date.now() + ttlMs };
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signature = sign(payloadB64, secret);
    return `${payloadB64}.${signature}`;
}
export function verifyAuthToken(token, secret) {
    if (!token)
        return null;
    const parts = token.split(".");
    if (parts.length !== 2)
        return null;
    const [payloadB64, signature] = parts;
    const expectedSignature = sign(payloadB64, secret);
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !timingSafeEqual(a, b))
        return null;
    try {
        const payload = JSON.parse(base64UrlDecode(payloadB64));
        if (typeof payload.email !== "string" || typeof payload.exp !== "number")
            return null;
        if (Date.now() > payload.exp)
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
