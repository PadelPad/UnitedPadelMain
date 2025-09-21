// server/middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Validates Supabase JWTs using SUPABASE_JWT_SECRET.
 * Adds req.user = { id: <uuid>, role?: string, email?: string }
 */
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new Error('SUPABASE_JWT_SECRET not configured');

    const payload = jwt.verify(token, secret);
    // Supabase uses 'sub' for the user ID (uuid)
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', detail: err.message });
  }
}

/** Optional auth (attaches req.user if token is present and valid) */
export function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) return next();

    const payload = jwt.verify(token, secret);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch {
    // ignore invalid tokens
    return next();
  }
}
