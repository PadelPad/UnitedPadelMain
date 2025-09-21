// server/tests/setup.js
import { vi } from 'vitest';

// Mock Supabase client so tests don’t hit the real DB
vi.mock('../supabase/client.js', () => {
  const calls = { upsert: [], update: [], select: [] };

  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { id: 'user_123', email: 'test@example.com' }, error: null }),
            maybeSingle: async () => ({ data: { id: 'user_123', email: 'test@example.com' }, error: null }),
          }),
        }),
        upsert: async (data) => {
          calls.upsert.push(data);
          return { data, error: null };
        },
        update: async (data) => {
          calls.update.push(data);
          return { data, error: null };
        },
        insert: async (data) => ({ data, error: null }),
      }),
      __calls: calls,
    },
  };
});

// Mock auth so requests always have a fake user
vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (req, _res, next) => {
    req.user = { id: 'user_123' };
    next();
  },
}));
