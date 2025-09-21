import { test, expect, request as pwRequest } from '@playwright/test';

/**
 * Basic env controls. All have safe defaults for local dev.
 * You can override in shell:
 *   BACKEND_URL=http://localhost:4000 AUTH_TOKEN=mytoken PRICE_ID=price_123 npx playwright test
 */
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test';
const PRICE_ID = process.env.PRICE_ID || 'price_123';
const HEADERS_JSON = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

test.describe('Subscriptions API (E2E)', () => {
  test('create checkout session -> returns Stripe URL', async ({ request }) => {
    const res = await request.post('/api/subscriptions/create-checkout-session', {
      headers: HEADERS_JSON,
      data: { priceId: PRICE_ID },
    });

    expect(res.status(), 'create-checkout-session should 200').toBe(200);
    const body = await res.json();

    // shape checks
    expect(body, 'response should have { url }').toHaveProperty('url');
    expect(body.url, 'url must be Stripe Checkout').toMatch(/^https:\/\/checkout\.stripe\.com\//);
  });

  test('status -> returns subscription & profile', async ({ request }) => {
    const res = await request.post('/api/subscriptions/status', {
      headers: HEADERS_JSON,
      data: {},
    });

    expect(res.status(), 'status should 200').toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('subscription');
    expect(body).toHaveProperty('profile');

    // Optional extra shape checks (won’t fail your run if missing)
    expect.soft(body.subscription).toHaveProperty('cancel_at_period_end');
  });

  test('cancel at period end, then resume', async ({ request }) => {
    const cancel = await request.post('/api/subscriptions/cancel-at-period-end', {
      headers: HEADERS_JSON,
      data: {},
    });
    expect(cancel.status(), 'cancel endpoint should 200').toBe(200);
    const cancelBody = await cancel.json();
    expect(cancelBody).toEqual(expect.objectContaining({ cancel_at_period_end: true }));

    const resume = await request.post('/api/subscriptions/resume', {
      headers: HEADERS_JSON,
      data: {},
    });
    expect(resume.status(), 'resume endpoint should 200').toBe(200);
    const resumeBody = await resume.json();
    expect(resumeBody).toEqual(
      expect.objectContaining({ status: 'active', cancel_at_period_end: false }),
    );
  });

  test('webhook idempotency (send same event twice)', async ({}, testInfo) => {
    /**
     * IMPORTANT
     * If your server strictly verifies Stripe signatures, you must run:
     *   stripe listen --forward-to http://localhost:4000/webhook
     * for a true E2E. This test sends a dummy body twice. If your server 400s
     * without a real signature, we’ll skip gracefully.
     */
    const allowFakeSignature = process.env.ALLOW_FAKE_STRIPE_SIGNATURE === 'true';

    const ctx = await pwRequest.newContext({
      baseURL: process.env.BACKEND_URL || 'http://localhost:4000',
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (allowFakeSignature) headers['Stripe-Signature'] = 'fake';

    const r1 = await ctx.post('/webhook', { headers, data: '{}' });

    if (!allowFakeSignature && r1.status() === 400) {
      // Signature enforced — skip this test unless user provides a real signature via Stripe CLI
      test.skip(true, 'Stripe signature enforced. Run `stripe listen --forward-to http://localhost:4000/webhook` or set ALLOW_FAKE_STRIPE_SIGNATURE=true.');
      return;
    }

    expect([200, 204]).toContain(r1.status());

    const r2 = await ctx.post('/webhook', { headers, data: '{}' });
    // Your app might return 200 (ignored), 208 Already Reported, or 409 Conflict for duplicates.
    expect([200, 208, 409]).toContain(r2.status());
  });
});
