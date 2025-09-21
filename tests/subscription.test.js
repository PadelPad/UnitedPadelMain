// server/tests/subscription.test.js
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const USER_ID = '00000000-0000-0000-0000-000000000001';

// Supabase mock
vi.mock('../supabase/client.js', () => {
  const calls = {
    profilesUpdate: [],
    subscriptionsUpdate: [],
    subscriptionsUpsert: [],
  };

  function ok() {
    return { data: null, error: null };
  }

  function tableHandler(table) {
    return {
      select(cols) {
        this._select = cols;
        return this;
      },
      eq(col, val) {
        if (table === 'profiles' && col === 'id' && val === USER_ID) {
          return {
            single: async () => {
              if (this._select?.includes('email')) {
                return { data: { id: USER_ID, email: 'test@example.com', stripe_customer_id: null }, error: null };
              }
              return { data: { subscription_tier: 'individual_plus', is_subscribed: true, stripe_customer_id: 'cus_123' }, error: null };
            },
            maybeSingle: async () => ({ data: null, error: null }),
          };
        }
        if (table === 'subscriptions' && col === 'user_id' && val === USER_ID) {
          const record = {
            user_id: USER_ID,
            stripe_subscription_id: 'sub_abc',
            status: 'active',
            updated_at: new Date().toISOString(),
          };
          return {
            order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: record, error: null }) }) }),
            maybeSingle: async () => ({ data: record, error: null }),
          };
        }
        if (table === 'subscriptions' && col === 'stripe_subscription_id') {
          return {
            single: async () => ({ data: { user_id: USER_ID }, error: null }),
            maybeSingle: async () => ({ data: { user_id: USER_ID }, error: null }),
          };
        }
        return {
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        };
      },
      update(payload) {
        if (table === 'profiles') calls.profilesUpdate.push(payload);
        if (table === 'subscriptions') calls.subscriptionsUpdate.push(payload);
        return { eq: () => ok() };
      },
      upsert(payload) {
        calls.subscriptionsUpsert.push(payload);
        return ok();
      },
      insert() {
        return ok();
      },
      order() { return this; },
      limit() { return this; },
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
    };
  }

  return {
    supabase: {
      from: (t) => tableHandler(t),
      __calls: calls,
    },
  };
});

// Stripe mock
vi.mock('stripe', () => ({
  default: class Stripe {
    constructor() {
      this.customers = { create: async ({ email }) => ({ id: 'cus_123', email }) };
      this.checkout = { sessions: { create: async () => ({ url: 'https://stripe.local/checkout' }) } };
      this.subscriptions = {
        update: async (_id, { cancel_at_period_end }) => ({ id: 'sub_abc', status: 'active', cancel_at_period_end }),
      };
    }
  },
}));

// Auth mock
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { id: USER_ID };
    next();
  },
}));

import app from '../app.js';
import { supabase } from '../supabase/client.js';

beforeEach(() => {
  supabase.__calls.profilesUpdate.length = 0;
  supabase.__calls.subscriptionsUpdate.length = 0;
  supabase.__calls.subscriptionsUpsert.length = 0;
});

describe('Subscription routes', () => {
  it('create-checkout-session returns Stripe URL', async () => {
    const res = await request(app)
      .post('/api/subscriptions/create-checkout-session')
      .set('Authorization', 'Bearer test')
      .send({ priceId: 'price_individual_plus' });

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^https:\/\/stripe\.local/);
    expect(supabase.__calls.profilesUpdate.length).toBe(1);
  });

  it('status returns subscription and profile', async () => {
    const res = await request(app)
      .post('/api/subscriptions/status')
      .set('Authorization', 'Bearer test')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('subscription');
    expect(res.body).toHaveProperty('profile');
  });

  it('cancel-at-period-end returns updated flags', async () => {
    const res = await request(app)
      .post('/api/subscriptions/cancel-at-period-end')
      .set('Authorization', 'Bearer test')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.cancel_at_period_end).toBe(true);
  });

  it('resume returns active and not canceling', async () => {
    const res = await request(app)
      .post('/api/subscriptions/resume')
      .set('Authorization', 'Bearer test')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'active', cancel_at_period_end: false });
  });
});
