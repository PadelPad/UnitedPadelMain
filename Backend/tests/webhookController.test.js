// server/tests/webhookController.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- Chainable Supabase mock (helper-level only) ----------
const calls = {
  upsert: [],
  update: [],
};

function ok() {
  return { data: null, error: null };
}

function tableHandler(table) {
  return {
    select() {
      return this;
    },
    eq(col, val) {
      // profiles: find by stripe_customer_id
      if (table === 'profiles' && col === 'stripe_customer_id') {
        return {
          single: async () => ({ data: { id: 'user-1' }, error: null }),
          maybeSingle: async () => ({ data: { id: 'user-1' }, error: null }),
        };
      }
      return {
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null }),
      };
    },
    upsert(payload) {
      calls.upsert.push(payload);
      return ok();
    },
    update(payload) {
      calls.update.push(payload);
      return { eq: () => ok() };
    },
  };
}

vi.mock('../supabase/client.js', () => ({
  supabase: {
    from: (table) => tableHandler(table),
    __calls: calls,
  },
}));

// Stable tier mapping for this test
vi.mock('../utils/tierMap.js', () => ({
  tierFromPriceId: (id) => (id === 'price_individual_plus' ? 'individual_plus' : null),
}));

// Import AFTER mocks
import { upsertSubscriptionFromStripe } from '../controllers/webhookController.js';
import { supabase } from '../supabase/client.js';

beforeEach(() => {
  calls.upsert.length = 0;
  calls.update.length = 0;
});

describe('upsertSubscriptionFromStripe', () => {
  it('upserts subscription and updates profile tier', async () => {
    const sub = {
      id: 'sub_abc',
      customer: 'cus_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000),
      items: { data: [{ price: { id: 'price_individual_plus' } }] },
    };

    await upsertSubscriptionFromStripe(supabase, sub);

    expect(calls.upsert.length).toBe(1);
    expect(calls.upsert[0].stripe_subscription_id).toBe('sub_abc');
    expect(calls.upsert[0].tier).toBe('individual_plus');

    expect(calls.update.length).toBe(1);
    expect(calls.update[0]).toMatchObject({
      is_subscribed: true,
      subscription_tier: 'individual_plus',
    });
  });
});
