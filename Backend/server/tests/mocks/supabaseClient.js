// server/tests/mocks/supabaseClient.js
export function createMockSupabase() {
  const calls = { upsert: [], update: [], select: [] };

  return {
    from: (table) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { id: 'user_123' }, error: null }),
          maybeSingle: async () => ({ data: { id: 'user_123' }, error: null }),
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
  };
}
