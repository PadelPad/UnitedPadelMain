import { test, expect, request, Page } from '@playwright/test';

// ====== EDIT THESE IF NEEDED ======
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const CREATE_SESSION_PATH = '/api/subscriptions/create-checkout-session'; // plural
const CHECKOUT_ENDPOINT = `${BACKEND_URL}${CREATE_SESSION_PATH}`;

// Jack's test token you shared earlier (OK for local testing; don't commit to git!)
const AUTH_TOKEN =
  process.env.AUTH_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzM5MTY1MC1iMWVlLTRjYzgtYjRhOC02ZWJjNmViMDE0ZTMiLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJpYXQiOjE3NTgyNjAyMjksImV4cCI6MTc1ODI2NzQyOX0.3qKmXr07S8fai6zp8UBqImYk_bK0J6H1laeiXA2R8K4';

// Price you gave (Club Elite) — change if you want a different product
const PRICE_ID = process.env.PRICE_ID || 'price_1Rpv9pRvEGYvE2Vtd3JeJt4Z';

// Stripe test card (no 3DS)
const CARD = { number: '4242424242424242', exp: '12 / 34', cvc: '123', postal: '12345' };
// ===================================

// Try hard to fill Stripe’s card inputs (Payment Element or legacy card).
async function fillStripeCardAndPay(page: Page) {
  // 1) Wait until we are on Stripe
  await page.waitForURL(/https:\/\/checkout\.stripe\.com\/.*/, { timeout: 60_000 });

  // 2) If there’s a payment-method chooser, pick Card
  const pickCard = async () => {
    const radio = page.getByRole('radio', { name: /^card$/i }).first();
    if (await radio.isVisible().catch(() => false)) {
      await radio.click();
      return;
    }
    const btn = page.getByRole('button', { name: /^card$/i }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    }
  };
  await pickCard();

  // 3) Fill card details inside Stripe iframes (defensive: try several candidates)
  const frameSelectors = [
    'iframe[title*="card"]',
    'iframe[title*="payment"]',
    'iframe[name^="__privateStripeFrame"]',
    'iframe[src*="stripe.com"]',
    'iframe',
  ];
  const candidates = {
    num: [
      'input[name="cardnumber"]',
      'input[data-elements-stable-field="cardNumber"]',
      'input[autocomplete="cc-number"]',
      'input[placeholder*="Card"]',
      'div[role="group"] input',
      'input',
    ],
    exp: [
      'input[name="exp-date"]',
      'input[data-elements-stable-field="cardExpiry"]',
      'input[autocomplete="cc-exp"]',
      'input[placeholder*="MM"]',
    ],
    cvc: [
      'input[name="cvc"]',
      'input[data-elements-stable-field="cardCvc"]',
      'input[autocomplete="cc-csc"]',
      'input[placeholder*="CVC"]',
    ],
    postal: [
      'input[autocomplete="postal-code"]',
      'input[name="postal"]',
      'input[placeholder*="Post"]',
      'input[placeholder*="ZIP"]',
    ],
  };

  let filledNumber = false;
  for (const fsel of frameSelectors) {
    const fhs = await page.locator(fsel).elementHandles().catch(() => []);
    for (const fh of fhs) {
      const f = await fh.contentFrame().catch(() => null);
      if (!f) continue;

      // number
      for (const sel of candidates.num) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(CARD.number);
          filledNumber = true;
          break;
        }
      }
      if (!filledNumber) continue;

      // expiry
      for (const sel of candidates.exp) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(CARD.exp);
          break;
        }
      }
      // cvc
      for (const sel of candidates.cvc) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(CARD.cvc);
          break;
        }
      }
      // postal (not always present)
      for (const sel of candidates.postal) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(CARD.postal);
          break;
        }
      }
      break; // done with current frame
    }
    if (filledNumber) break;
  }
  if (!filledNumber) throw new Error('Could not locate Stripe card number field.');

  // 4) Click Pay/Subscribe
  const payButtons = [
    page.getByRole('button', { name: /pay and subscribe/i }),
    page.getByRole('button', { name: /^pay\b/i }),
    page.getByRole('button', { name: /subscribe/i }),
    page.getByRole('button', { name: /complete/i }),
  ];

  let clicked = false;
  for (const btn of payButtons) {
    if (await btn.isVisible().catch(() => false)) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
        btn.click(),
      ]);
      clicked = true;
      break;
    }
  }
  if (!clicked) {
    // try inside frames too
    for (const fsel of frameSelectors) {
      const fhs = await page.locator(fsel).elementHandles().catch(() => []);
      for (const fh of fhs) {
        const f = await fh.contentFrame().catch(() => null);
        if (!f) continue;
        for (const name of [/pay and subscribe/i, /^pay\b/i, /subscribe/i, /complete/i]) {
          const btn = f.getByRole('button', { name });
          if (await btn.isVisible().catch(() => false)) {
            await Promise.all([
              page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
              btn.click(),
            ]);
            clicked = true;
            break;
          }
        }
        if (clicked) break;
      }
      if (clicked) break;
    }
  }
  expect(clicked, 'Could not find a Pay/Submit button in Stripe Checkout').toBeTruthy();

  // 5) Consider success when we leave checkout.stripe.com or see success-ish params
  await page.waitForURL(
    (u: URL) => {
      const s = u.toString();
      return !/checkout\.stripe\.com/.test(s) || /success|thank|complete|session_id/i.test(s);
    },
    { timeout: 45_000 }
  );
}

test.describe('Checkout via API (no UI login)', () => {
  test.setTimeout(5 * 60 * 1000); // 5 minutes

  test('create session -> go to Stripe -> pay', async ({ page }) => {
    // 1) create session via backend
    const ctx = await request.newContext({ baseURL: BACKEND_URL, extraHTTPHeaders: { Authorization: `Bearer ${AUTH_TOKEN}` } });
    const res = await ctx.post(CREATE_SESSION_PATH, {
      headers: { 'Content-Type': 'application/json' },
      data: { priceId: PRICE_ID }, // keep minimal; your backend accepts this
    });

    expect(res.status(), 'Expected 200 from create-checkout-session').toBe(200);
    const body = await res.json().catch(() => ({}));
    expect(body?.url, 'Response should include { url }').toBeTruthy();

    // 2) visit Stripe checkout url
    await page.goto(String(body.url), { waitUntil: 'domcontentloaded' });

    // 3) fill card + pay
    await fillStripeCardAndPay(page);

    // 4) We finished; optional: assert your app shows active sub on return page
    // e.g. await page.goto('http://localhost:3000/subscriptions');
    // await expect(page.getByText(/current plan|active/i)).toBeVisible();
  });
});
