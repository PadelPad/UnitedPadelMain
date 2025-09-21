// server/tests/webhook.edge.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

/**
 * Stripe mock – keep spies inside the factory to avoid TDZ on hoisting.
 */
vi.mock('stripe', () => {
  const constructEvent = vi.fn();
  const sessionCreate = vi.fn();
  const subUpdate = vi.fn();

  const Stripe = vi.fn().mockImplementation(() => ({
    webhooks: { constructEvent },
    checkout: { sessions: { create: sessionCreate } },
    subscriptions: { update: subUpdate },
  }));

  return {
    default: Stripe,
    __spies: { constructEvent, sessionCreate, subUpdate },
  };
});

/**
 * Supabase mock – single state bag declared before use, so no TDZ.
 * We expose minimal helpers for the test assertions.
 */
vi.mock('../supabase/client.js', () => {
  const state = {
    existingEventIds: new Set(), // simulate dedupe table
    userIdForSub: 'user_del',    // user owning the sub we "delete"
    recorded: {
      selectStripeEvents: [],
      insertStripeEvents: [],
      updateProfiles: [],
      updateSubs: [],
      selectSubForDelete: [],
    },
  };

  function from(name) {
    return {
      select: () => ({
        eq: (_col, val) => ({
          maybeSingle: async () => {
            if (name === 'stripe_events') {
              state.recorded.selectStripeEvents.push(val);
              return state.existingEventIds.has(val)
                ? { data: { id: val }, error: null }
                : { data: null, error: null };
            }
            if (name === 'subscriptions') {
              state.recorded.selectSubForDelete.push({ stripe_subscription_id: val });
              return { data: { user_id: state.userIdForSub }, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),

      insert: async (obj) => {
        if (name === 'stripe_events') {
          state.recorded.insertStripeEvents.push(obj.id);
          // treat insert as "we have it now"
          state.existingEventIds.add(obj.id);
          return { data: obj, error: null };
        }
        return { data: null, error: null };
      },

      update: (obj) => ({
        eq: async (col, val) => {
          if (name === 'profiles' && col === 'id') {
            state.recorded.updateProfiles.push({ id: val, obj });
            return { data: { id: val }, error: null };
          }
          if (name === 'subscriptions' && col === 'stripe_subscription_id') {
            state.recorded.updateSubs.push({ id: val, obj });
            return { data: { id: val }, error: null };
          }
          return { data: null, error: null };
        },
      }),

      // unused but present so code paths don't explode
      upsert: async () => ({ data: null, error: null }),
      maybeSingle: async () => ({ data: null, error: null }),
      eq: async () => ({ data: null, error: null }),
    };
  }

  const supabase = {
    from,
    __state: state,
    __reset() {
      state.existingEventIds = new Set();
      state.userIdForSub = 'user_del';
      state.recorded.selectStripeEvents.length = 0;
      state.recorded.insertStripeEvents.length = 0;
      state.recorded.updateProfiles.length = 0;
      state.recorded.updateSubs.length = 0;
      state.recorded.selectSubForDelete.length = 0;
    },
    __set(opts = {}) {
      if (opts.existingEventIds) {
        state.existingEventIds = new Set(opts.existingEventIds);
      }
      if (typeof opts.userIdForSub === 'string') {
        state.userIdForSub = opts.userIdForSub;
      }
    },
  };

  return { supabase };
});

// import AFTER mocks
import app from '../app.js';
import * as StripeMod from 'stripe';
import { supabase } from '../supabase/client.js';

const stripe = StripeMod.__spies;

describe('Stripe webhook (edge cases)', () => {
  beforeEach(() => {
    supabase.__reset();
    stripe.constructEvent.mockReset();
  });

  it('returns duplicate:true when the same event is sent twice', async () => {
    stripe.constructEvent.mockReturnValueOnce({
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: {} },
    });

    // first time — processed & stored
    let res = await request(app).post('/webhook').set('Stripe-Signature', 'fake').send('{}');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    // mark as existing and resend
    supabase.__set({ existingEventIds: ['evt_dup'] });

    stripe.constructEvent.mockReturnValueOnce({
      id: 'evt_dup',
      type: 'checkout.session.completed',
      data: { object: {} },
    });

    res = await request(app).post('/webhook').set('Stripe-Signature', 'fake').send('{}');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, duplicate: true });
  });

  it('handles customer.subscription.deleted and updates profile & sub', async () => {
    stripe.constructEvent.mockReturnValueOnce({
      id: 'evt_sub_deleted',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_to_delete' } },
    });

    const res = await request(app).post('/webhook').set('Stripe-Signature', 'fake').send('{}');
    expect(res.status).toBe(200);

    // subscription marked canceled
    expect(
      supabase.__state.recorded.updateSubs.some(
        (c) => c.id === 'sub_to_delete' && c.obj.status === 'canceled'
      )
    ).toBe(true);

    // profile flags reset
    expect(
      supabase.__state.recorded.updateProfiles.some((c) => c.obj.is_subscribed === false)
    ).toBe(true);
  });

  it('ignores invoice.payment_failed (returns 200)', async () => {
    stripe.constructEvent.mockReturnValueOnce({
      id: 'evt_invoice_failed',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_123' } },
    });

    const res = await request(app).post('/webhook').set('Stripe-Signature', 'fake').send('{}');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});
