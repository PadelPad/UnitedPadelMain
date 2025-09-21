// server/tests/webhook.test.js
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase mock
vi.mock('../supabase/client.js', () => {
  const calls = {
    stripe_events_insert: [],
    subscriptions_upsert: [],
    profiles_update: [],
  };

  function ok() {
    return { data: null, error: null };
  }

  function tableHandler(table) {
    return {
      select() { return this; },
      eq(col, val) {
        if (table === 'stripe_events' && col === 'id') {
          return { maybeSingle: async () => ({ data: null, error: null }) };
        }
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
      insert(payload) {
        if (table === 'stripe_events') calls.stripe_events_insert.push(payload);
        return ok();
      },
      upsert(payload) {
        if (table === 'subscriptions') calls.subscriptions_upsert.push(payload);
        return ok();
      },
      update(payload) {
        if (table === 'profiles') calls.profiles_update.push(payload);
        return { eq: () => ok() };
      },
    };
  }

  return {
    supabase: {
      from: (t) => tableHandler(t),
      __calls: calls,
    },
  };
});

// Tier map mock
vi.mock('../utils/tierMap.js', () => ({
  tierFromPriceId: (id) => (id === 'price_individual_plus' ? 'individual_plus' : null),
}));

// Stripe mock
vi.mock('stripe', () => ({
  default: class Stripe {
    constructor() {
      this.webhooks = {
        constructEvent: () => ({
          id: 'evt_1',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_abc',
              customer: 'cus_123',
              status: 'active',
              current_period_end: Math.floor(Date.now() / 1000),
              items: { data: [{ price: { id: 'price_individual_plus' } }] },
            },
          },
        }),
      };
    }
  },
}));

import app from '../app.js';
import { supabase } from '../supabase/client.js';

beforeEach(() => {
  supabase.__calls.stripe_events_insert.length = 0;
  supabase.__calls.subscriptions_upsert.length = 0;
  supabase.__calls.profiles_update.length = 0;
});

describe('Stripe webhook', () => {
  it('handles subscription.updated and updates DB', async () => {
    const res = await request(app)
      .post('/webhook')
      .set('stripe-signature', 'fake')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ received: true });

    expect(supabase.__calls.stripe_events_insert.length).toBe(1);
    expect(supabase.__calls.subscriptions_upsert.length).toBe(1);
    expect(supabase.__calls.profiles_update.length).toBe(1);
  });
});
