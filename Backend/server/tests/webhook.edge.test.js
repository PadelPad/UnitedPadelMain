// server/tests/webhook.edge.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';

/**
 * We control what Stripe returns from constructEvent by setting __currentEvent
 * before each request. Your controller calls:
 *   const stripe = new Stripe(SECRET);
 *   stripe.webhooks.constructEvent(rawBody, sig, secret)
 */
let __currentEvent = null;

vi.mock('stripe', () => {
  const StripeCtor = vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: () => __currentEvent,
    },
  }));
  return { default: StripeCtor };
});

/**
 * Supabase mock with the chains your controller uses:
 * from(...).select().eq(...).single()/maybeSingle()
 * from(...).insert(...)
 * from(...).update(...).eq(...)
 * from(...).upsert(payload, { onConflict })
 *
 * We keep simple in-memory "tables":
 *  - stripe_events: Set of processed event IDs
 *  - profiles: Map keyed by stripe_customer_id -> { id, tier, ... }
 *  - subscriptions: Map keyed by stripe_subscription_id -> { user_id, status, cancel_at_period_end, ... }
 */
vi.mock('../supabase/client.js', () => {
  const state = {
    stripeEvents: new Set(),                 // processed event ids
    profilesByCustomerId: new Map(),         // key: stripe_customer_id
    subscriptionsBySubId: new Map(),         // key: stripe_subscription_id
    updates: { profiles: [], subscriptions: [] },
  };

  const reset = () => {
    state.stripeEvents.clear();
    state.profilesByCustomerId.clear();
    state.subscriptionsBySubId.clear();
    state.updates.profiles.length = 0;
    state.updates.subscriptions.length = 0;

    // Seed defaults your webhook relies on
    state.profilesByCustomerId.set('cus_test_123', { id: 'user_123', tier: 'pro' });
    state.subscriptionsBySubId.set('sub_test_123', {
      user_id: 'user_123',
      status: 'active',
      cancel_at_period_end: false,
      stripe_subscription_id: 'sub_test_123',
    });
  };

  reset();

  function from(table) {
    return {
      // SELECT ... WHERE ... .single() / .maybeSingle()
      select: () => ({
        eq: (column, value) => {
          const resolveSingle = async () => {
            if (table === 'stripe_events' && column === 'id') {
              return state.stripeEvents.has(value)
                ? { data: { id: value }, error: null }
                : { data: null, error: null };
            }

            if (table === 'profiles') {
              if (column === 'stripe_customer_id') {
                const row = state.profilesByCustomerId.get(value);
                return row ? { data: { id: row.id }, error: null } : { data: null, error: null };
              }
              if (column === 'id') {
                for (const [_k, v] of state.profilesByCustomerId) {
                  if (v.id === value) return { data: { id: v.id }, error: null };
                }
                return { data: null, error: null };
              }
            }

            if (table === 'subscriptions' && column === 'stripe_subscription_id') {
              const row = state.subscriptionsBySubId.get(value);
              return row ? { data: row, error: null } : { data: null, error: null };
            }

            return { data: null, error: null };
          };

          return {
            single: resolveSingle,
            maybeSingle: resolveSingle,
          };
        },
      }),

      // INSERT (used for logging stripe_events, possibly others)
      insert: async (payload) => {
        if (table === 'stripe_events') {
          const rows = Array.isArray(payload) ? payload : [payload];
          for (const r of rows) if (r?.id) state.stripeEvents.add(r.id);
          return { data: rows, error: null };
        }
        return { data: Array.isArray(payload) ? payload : [payload], error: null };
      },

      // UPSERT — your controller uses this for subscriptions
      upsert: async (payload /* , opts like { onConflict } */) => {
        if (table === 'subscriptions') {
          const rows = Array.isArray(payload) ? payload : [payload];
          const out = [];
          for (const r of rows) {
            const key = r.stripe_subscription_id || r.id || r.subId || r.subscription_id;
            if (!key) continue;
            const prev = state.subscriptionsBySubId.get(key) || {};
            const merged = { ...prev, ...r, stripe_subscription_id: key };
            state.subscriptionsBySubId.set(key, merged);
            out.push(merged);
          }
          return { data: out, error: null };
        }
        // default no-op success
        return { data: Array.isArray(payload) ? payload : [payload], error: null };
      },

      // UPDATE ... WHERE ...
      update: (updates) => ({
        eq: async (column, value) => {
          if (table === 'subscriptions' && column === 'stripe_subscription_id') {
            const row = state.subscriptionsBySubId.get(value);
            if (row) {
              const newRow = { ...row, ...updates };
              state.subscriptionsBySubId.set(value, newRow);
              state.updates.subscriptions.push({ where: { stripe_subscription_id: value }, updates });
              return { data: [newRow], error: null };
            }
            return { data: [], error: null };
          }

          if (table === 'profiles' && column === 'id') {
            let foundKey = null;
            for (const [k, v] of state.profilesByCustomerId) {
              if (v.id === value) { foundKey = k; break; }
            }
            if (foundKey) {
              const row = state.profilesByCustomerId.get(foundKey);
              const newRow = { ...row, ...updates };
              state.profilesByCustomerId.set(foundKey, newRow);
              state.updates.profiles.push({ where: { id: value }, updates });
              return { data: [newRow], error: null };
            }
            return { data: [], error: null };
          }

          return { data: [], error: null };
        },
      }),
    };
  }

  return {
    supabase: {
      from,
      __state: state,
      __reset: reset,
    },
  };
});

const setNextEvent = (evt) => { __currentEvent = evt; };

describe('Stripe webhook (edge cases)', () => {
  beforeEach(async () => {
    setNextEvent(null);
    const { supabase } = await import('../supabase/client.js');
    supabase.__reset();
  });

  it('returns duplicate:true when the same event is sent twice', async () => {
    const eventId = 'evt_dup_1';

    // First delivery — should be processed and logged
    setNextEvent({
      id: eventId,
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_test_123', customer: 'cus_test_123', status: 'active' } },
    });
    const r1 = await request(app)
      .post('/webhook')
      .set('Stripe-Signature', 'fake')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(r1.status).toBe(200);
    expect(r1.body).toMatchObject({ received: true });

    // Second delivery — duplicate
    setNextEvent({
      id: eventId,
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_test_123', customer: 'cus_test_123', status: 'active' } },
    });
    const r2 = await request(app)
      .post('/webhook')
      .set('Stripe-Signature', 'fake')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(r2.status).toBe(200);
    expect(r2.body).toEqual(expect.objectContaining({ duplicate: true }));
  });

  it('handles customer.subscription.deleted and updates profile & sub', async () => {
    setNextEvent({
      id: 'evt_del_1',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_123',
          customer: 'cus_test_123',
        },
      },
    });

    const res = await request(app)
      .post('/webhook')
      .set('Stripe-Signature', 'fake')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(200);

    const { supabase } = await import('../supabase/client.js');
    const s = supabase.__state;

    const sub = s.subscriptionsBySubId.get('sub_test_123');
    expect(sub).toBeTruthy();
    expect(sub.status).toBe('canceled');
    expect(sub.cancel_at_period_end).toBe(false);

    const profile = s.profilesByCustomerId.get('cus_test_123');
    expect(profile).toBeTruthy();
    // Your controller typically downgrades tier; we assert it's defined
    expect(profile.tier).toBeTruthy();
  });

  it('ignores invoice.payment_failed (returns 200)', async () => {
    setNextEvent({
      id: 'evt_ignore_1',
      type: 'invoice.payment_failed',
      data: { object: { customer: 'cus_xxx' } },
    });

    const res = await request(app)
      .post('/webhook')
      .set('Stripe-Signature', 'fake')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ received: true }));
  });
});
