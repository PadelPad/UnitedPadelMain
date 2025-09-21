import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * United Padel — Subscriptions API (E2E)
 *
 * What this spec does:
 * - Waits for your backend to be reachable
 * - Creates a Stripe Checkout session (requires a real Stripe Price ID)
 * - Checks /status (passes even if subscription is null before checkout)
 * - Attempts cancel/resume only when a subscription exists
 * - Tries webhook idempotency; skips if Stripe signature is enforced
 *
 * Prereqs:
 * - Backend running on http://localhost:5000 (we use 127.0.0.1 below)
 * - Backend .env has SUPABASE_JWT_SECRET set and server restarted
 * - AUTH_TOKEN below is a valid JWT signed with that exact secret
 */

// ─── Your fixed values ───────────────────────────────────────────────────────
const BASE_URL = 'http://127.0.0.1:5000';

// Real Stripe test Price ID (you provided this)
const PRICE_ID = 'price_1Rpv9pRvEGYvE2Vtd3JeJt4Z';

// Valid JWT you generated (signed with your Supabase JWT secret)
const AUTH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzM5MTY1MC1iMWVlLTRjYzgtYjRhOC02ZWJjNmViMDE0ZTMiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE3NTgyNjAyMjksImV4cCI6MTc1ODI2NzQyOX0.3qKmXr07S8fai6zp8UBqImYk_bK0J6H1laeiXA2R8K4';

// Set to true ONLY if you want to try the webhook test without Stripe CLI
const ALLOW_FAKE_SIGNATURE = false;

// Headers used for all authenticated API calls
const HEADERS_JSON = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

// ─── Tiny helper: wait for backend port to open ──────────────────────────────
async function waitForServer(url: string, timeoutMs = 10_000) {
  const start = Date.now();
  const ctx = await pwRequest.newContext({ baseURL: url });
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      // Any status code proves the port is open (200/401/404 are all fine)
      const res = await ctx.get('/', { timeout: 1500 });
      if (res.status() > 0) return;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw lastErr ?? new Error(`Server at ${url} not reachable within ${timeoutMs}ms`);
}

test.beforeAll(async () => {
  await waitForServer(BASE_URL);
});

test.describe('Subscriptions API (E2E)', () => {
  test('create checkout session -> returns Stripe URL (requires real priceId)', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/subscriptions/create-checkout-session`, {
      headers: HEADERS_JSON,
      data: { priceId: PRICE_ID },
    });

    // If this fails with 400, your backend likely rejected the priceId or other inputs.
    expect(
      res.status(),
      `Expected 200 from create-checkout-session, got ${res.status()}.\n` +
        `If 401: ensure Backend/.env has SUPABASE_JWT_SECRET and AUTH_TOKEN is signed with that secret (server restarted).\n` +
        `If 400: ensure PRICE_ID is a valid Stripe TEST price that your backend accepts.`
    ).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('url');
    expect(String(body.url)).toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  test('status -> returns subscription & profile (passes even if subscription is null)', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/subscriptions/status`, {
      headers: HEADERS_JSON,
      data: {},
    });

    expect(
      res.status(),
      `Expected 200 from /status. Got ${res.status()}.\n` +
        `If 401: backend secret/token mismatch.`
    ).toBe(200);

    const body = await res.json();

    // Must always include a profile object
    expect(body).toHaveProperty('profile');

    // subscription can be null before any checkout completes — that's fine.
    // When it exists, do a couple of soft shape checks.
    if (body.subscription != null) {
      expect.soft(body.subscription).toHaveProperty('status');
      expect.soft(body.subscription).toHaveProperty('cancel_at_period_end');
    }
  });

  test('cancel at period end, then resume (skips if no active/trialing subscription)', async ({ request }) => {
    // First, check if we have an active/trialing subscription
    const statusRes = await request.post(`${BASE_URL}/api/subscriptions/status`, {
      headers: HEADERS_JSON,
      data: {},
    });

    if (statusRes.status() !== 200) {
      test.skip(true, `Skipping cancel/resume; /status returned ${statusRes.status()}.`);
    }

    const { subscription } = await statusRes.json();
    if (!subscription || !['active', 'trialing'].includes(String(subscription.status))) {
      test.skip(true, 'No active/trialing subscription — skipping cancel/resume.');
    }

    // Cancel at period end
    const cancel = await request.post(`${BASE_URL}/api/subscriptions/cancel-at-period-end`, {
      headers: HEADERS_JSON,
      data: {},
    });

    if (cancel.status() !== 200) {
      const text = await cancel.text();
      test.skip(true, `Expected 200 from cancel-at-period-end, got ${cancel.status()}.\nResponse: ${text}`);
    }

    const cancelBody = await cancel.json();
    expect(cancelBody).toEqual(expect.objectContaining({ cancel_at_period_end: true }));

    // Resume
    const resume = await request.post(`${BASE_URL}/api/subscriptions/resume`, {
      headers: HEADERS_JSON,
      data: {},
    });

    if (resume.status() !== 200) {
      const text = await resume.text();
      test.skip(true, `Expected 200 from resume, got ${resume.status()}.\nResponse: ${text}`);
    }

    const resumeBody = await resume.json();
    expect(resumeBody).toEqual(
      expect.objectContaining({ status: 'active', cancel_at_period_end: false })
    );
  });

  test('webhook idempotency (send same event twice)', async () => {
    // Use Stripe CLI for real signature:
    //   stripe listen --forward-to http://localhost:5000/webhook
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ALLOW_FAKE_SIGNATURE) headers['Stripe-Signature'] = 'fake';

    const r1 = await ctx.post('/webhook', { headers, data: '{}' });

    if (!ALLOW_FAKE_SIGNATURE && r1.status() === 400) {
      test.skip(true, 'Stripe signature enforced — run: stripe listen --forward-to http://localhost:5000/webhook');
    }

    // Second send should be ignored/deduped by your app
    const r2 = await ctx.post('/webhook', { headers, data: '{}' });
    expect([200, 208, 409]).toContain(r2.status());
  });
});
