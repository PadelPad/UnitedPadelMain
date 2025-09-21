// server/security/auth.js
import { createClient } from '@supabase/supabase-js';

// Server-side admin client (service role key stays on the server only)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Pulls a Bearer token, verifies it with Supabase, and ensures the caller's userId matches the token.
 * Use this on routes that accept a body/query/param containing userId.
 */
export const requireAuthSameUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const claimedUserId =
      req.body?.userId || req.query?.userId || req.params?.userId;

    if (!token || !claimedUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate token with Supabase (signature + expiration)
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (data.user.id !== claimedUserId) {
      return res.status(403).json({ error: 'Forbidden (user mismatch)' });
    }

    // Attach user to request (handy for downstream)
    req.user = data.user;
    return next();
  } catch (e) {
    console.error('Auth error', e);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
