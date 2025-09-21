// server/tests/subscription.edge.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// --- Auth mock: bypass & inject req.user (so userId is optional) ---
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => {
    req.user = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'edge@test.dev',
    };
    next();
  },
}));

// --- Stripe mock (internal spies to avoid TDZ) ---
vi.mock('stripe', () => {
  const sessionCreate = vi.fn();
  const subUpdate = vi.fn();
  const constructEvent = vi.fn();
  const Stripe = vi.fn().mockImplementation(() => ({
    checkout: { sessions: { create: sessionCreate } },
    subscriptions: { update: subUpdate },
    webhooks: { constructEvent },
  }));
  return {
    default: Stripe,
    __spies: { sessionCreate, subUpdate, constructEvent },
  };
});

// --- Supabase mock with internal state & helpers ---
vi.mock('../supabase/client.js', () => {
  const behavior = {
    profilesSingle: {
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'edge@test.dev',
        stripe_customer_id: 'cus_edge',
      },
      error: null,
    },
    subsMaybeSingle: { data: null, error: null },
  };

  const calls = {
    selectProfiles: [],
    updateProfiles: [],
    selectSubs: [],
    updateSubs: [],
    upsertStripeEvents: [],
  };

  const table = (name) => ({
    select: (_cols) => ({
      eq: (col, val) => ({
        single: async () => {
          if (name === 'profiles' && col === 'id') {
            calls.selectProfiles.push({ id: val });
            return behavior.profilesSingle ?? { data: null, error: null };
          }
          return { data: null, error: null };
        },
        maybeSingle: async () => {
          if (name === 'subscriptions' && col === 'user_id') {
            calls.selectSubs.push({ user_id: val });
            return behavior.subsMaybeSingle ?? { data: null, error: null };
          }
          return { data: null, error: null };
        },
        order: () => ({
          limit: () => ({
            maybeSingle: async () => {
              if (name === 'subscriptions' && col === 'user_id') {
                calls.selectSubs.push({ user_id: val });
                return behavior.subsMaybeSingle ?? { data: null, error: null };
              }
              return { data: null, error: null };
            },
          }),
        }),
      }),
    }),
    update: (obj) => ({
      eq: async (col, val) => {
        if (name === 'profiles' && col === 'id') {
          calls.updateProfiles.push({ where: { id: val }, update: obj });
          return { data: { id: val }, error: null };
        }
        if (name === 'subscriptions' && col === 'stripe_subscription_id') {
          calls.updateSubs.push({ where: { stripe_subscription_id: val }, update: obj });
          return { data: { stripe_subscription_id: val }, error: null };
        }
        return { data: null, error: null };
      },
    }),
    insert: async (obj) => {
      if (name === 'stripe_events') {
        calls.upsertStripeEvents.push({ insert: obj });
        return { data: obj, error: null };
      }
      return { data: null, error: null };
    },
    upsert: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    eq: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  });

  const supabase = {
    from: table,
    __calls: calls,
    __setBehavior(next) {
      if (next?.profilesSingle !== undefined) behavior.profilesSingle = next.profilesSingle;
      if (next?.subsMaybeSingle !== undefined) behavior.subsMaybeSingle = next.subsMaybeSingle;
    },
    __resetCalls() {
      calls.selectProfiles.length = 0;
      calls.updateProfiles.length = 0;
      calls.selectSubs.length = 0;
      calls.updateSubs.length = 0;
      calls.upsertStripeEvents.length = 0;
    },
  };

  return { supabase };
});

// import app AFTER mocks
import app from '../app.js';
import { supabase } from '../supabase/client.js';

describe('Subscription routes (edge cases)', () => {
  beforeEach(() => {
    supabase.__resetCalls();
    supabase.__setBehavior({
      profilesSingle: {
        data: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'edge@test.dev',
          stripe_customer_id: 'cus_edge',
        },
        error: null,
      },
      subsMaybeSingle: { data: null, error: null },
    });
  });

  it('create-checkout-session -> 400 when body is invalid (missing priceId)', async () => {
    const res = await request(app)
      .post('/api/subscriptions/create-checkout-session')
      .set('Authorization', 'Bearer test')
      .send({ userId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('create-checkout-session -> 404 when profile not found', async () => {
    supabase.__setBehavior({
      profilesSingle: { data: null, error: null },
    });

    const res = await request(app)
      .post('/api/subscriptions/create-checkout-session')
      .set('Authorization', 'Bearer test')
      .send({ priceId: 'price_missing', userId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Profile not found' });
  });

  it('status -> 200 when userId missing (uses req.user.id)', async () => {
    const res = await request(app)
      .post('/api/subscriptions/status')
      .set('Authorization', 'Bearer test')
      .send({}); // no userId on purpose

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('subscription');
    expect(res.body).toHaveProperty('profile');
  });

  it('cancel-at-period-end -> 404 when subscription not found', async () => {
    const res = await request(app)
      .post('/api/subscriptions/cancel-at-period-end')
      .set('Authorization', 'Bearer test')
      .send({ userId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Active subscription not found' });
  });

  it('resume -> 404 when subscription not found', async () => {
    const res = await request(app)
      .post('/api/subscriptions/resume')
      .set('Authorization', 'Bearer test')
      .send({ userId: '00000000-0000-0000-0000-000000000000' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Subscription not found' });
  });
});
