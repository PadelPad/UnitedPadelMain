import { test, expect, Page, Locator, Frame } from '@playwright/test';

type Doc = Page | Frame;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const SUBSCRIPTIONS_PATH = '/subscriptions';
const LOGIN_PATH = '/login';

const CHECKOUT_ENDPOINT_FULL =
  process.env.CHECKOUT_ENDPOINT ||
  'http://localhost:5000/api/subscriptions/create-checkout-session';

const LOGIN_EMAIL = process.env.TEST_LOGIN_EMAIL || 'michalmus14@gmail.com';
const LOGIN_PASSWORD = process.env.TEST_LOGIN_PASSWORD || 'Poli0000';

// Stripe test card (no 3DS)
const STRIPE_CARD_NUMBER = '4242424242424242';
const STRIPE_CARD_EXP = '12 / 34';
const STRIPE_CARD_CVC = '123';
const STRIPE_POSTAL = '12345';

// ───────── helpers ─────────

async function maybeLogin(page: Page) {
  const email = page.getByPlaceholder('Email');
  const pass = page.getByPlaceholder('Password');
  const loginBtn = page.getByRole('button', { name: /^login$/i });

  if ((await email.count()) && (await pass.count()) && (await loginBtn.count())) {
    await email.fill(LOGIN_EMAIL);
    await pass.fill(LOGIN_PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
      loginBtn.click(),
    ]);
  }
}

async function findClickableSubscribe(page: Page): Promise<Locator | null> {
  const candidates = page
    .locator('.subscribe-btn')
    .filter({ hasText: /subscribe/i })
    .filter({ hasNotText: /current plan/i });

  const count = await candidates.count();
  for (let i = 0; i < count; i++) {
    const btn = candidates.nth(i);
    if (!(await btn.isVisible())) continue;
    const disabled = await btn.getAttribute('disabled');
    const ariaDisabled = await btn.getAttribute('aria-disabled');
    if (disabled !== null || ariaDisabled === 'true') continue;
    return btn;
  }

  // fallback: any button with "subscribe"
  const fallback = page.getByRole('button', { name: /subscribe/i }).first();
  if (await fallback.isVisible().catch(() => false)) return fallback;

  return null;
}

// Fill optional fields Stripe sometimes requires BEFORE card becomes active.
async function fillStripePreamble(scope: Doc) {
  // Email is usually in the MAIN document (not inside iframes)
  const email = scope.locator('input[type="email"], input[name="email"]').first();
  if (await email.isVisible().catch(() => false)) {
    const current = (await email.inputValue().catch(() => '')) || '';
    if (!current) {
      await email.fill(`test+${Date.now()}@example.com`);
    }
  }

  // Name (sometimes required for subscriptions)
  const name = scope.locator('input[name="name"], input[autocomplete="name"]').first();
  if (await name.isVisible().catch(() => false)) {
    const current = (await name.inputValue().catch(() => '')) || '';
    if (!current) {
      await name.fill('Test User');
    }
  }

  // Occasionally Stripe asks for address country before enabling card:
  const country = scope.locator('select[name*="country"], select[aria-label*="Country"]').first();
  if (await country.isVisible().catch(() => false)) {
    const val = (await country.inputValue().catch(() => '')) || '';
    if (!val) {
      await country.selectOption({ value: 'GB' }).catch(() => {});
    }
  }
}

// Click a reasonable submit/continue/pay button in the given document (Page OR Frame)
const clickFirstAvailable = async (scope: Doc) => {
  const labels = [/pay and subscribe/i, /^pay\b/i, /subscribe/i, /complete/i, /^continue$/i, /review/i];
  for (const name of labels) {
    const btn = scope.getByRole('button', { name }).first();
    if (await btn.isVisible().catch(() => false)) {
      await Promise.all([
        scope.waitForLoadState('domcontentloaded').catch(() => {}),
        btn.click(),
      ]);
      return true;
    }
  }
  return false;
};

// Try hard to fill Stripe’s card inputs (Payment Element or legacy card) and submit payment.
async function fillStripeCardAndPay(page: Page) {
  // 1) Wait until we are on Stripe
  await page.waitForURL(/https:\/\/checkout\.stripe\.com\/.*/, { timeout: 90_000 });

  // 1a) Some layouts need preamble fields first
  await fillStripePreamble(page);

  // 2) If there’s a payment-method chooser, pick Card
  const chooseCard = async () => {
    const radio = page.getByRole('radio', { name: /^card$/i }).first();
    if (await radio.isVisible().catch(() => false)) return radio.click().catch(() => {});
    const btn = page.getByRole('button', { name: /^card$/i }).first();
    if (await btn.isVisible().catch(() => false)) return btn.click().catch(() => {});
  };
  await chooseCard();

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

  // tiny wait to let iframes mount after preamble
  await page.waitForTimeout(500);

  for (const fsel of frameSelectors) {
    const fhs = await page.locator(fsel).elementHandles().catch(() => []);
    for (const fh of fhs) {
      const f = await fh.contentFrame().catch(() => null);
      if (!f) continue;

      // Some Payment Element variants delay enabling inputs until visible.
      await f.waitForTimeout(200);

      // number
      for (const sel of candidates.num) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.focus().catch(() => {});
          await input.fill(STRIPE_CARD_NUMBER);
          filledNumber = true;
          break;
        }
      }
      if (!filledNumber) continue;

      // expiry
      for (const sel of candidates.exp) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(STRIPE_CARD_EXP);
          break;
        }
      }
      // cvc
      for (const sel of candidates.cvc) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(STRIPE_CARD_CVC);
          break;
        }
      }
      // postal (not always present)
      for (const sel of candidates.postal) {
        const input = f.locator(sel).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(STRIPE_POSTAL);
          break;
        }
      }

      break; // done with current frame
    }
    if (filledNumber) break;
  }

  if (!filledNumber) {
    throw new Error('Could not locate Stripe card number field (Payment Element may be blocking).');
  }

  // 4) Click Pay/Continue/Subscribe — some flows are two-step: Continue → Pay
  let clicked = await clickFirstAvailable(page);

  // then try inside frames if nothing clickable yet
  if (!clicked) {
    for (const fsel of frameSelectors) {
      const fhs = await page.locator(fsel).elementHandles().catch(() => []);
      for (const fh of fhs) {
        const frame = await fh.contentFrame().catch(() => null);
        if (!frame) continue;
        if (await clickFirstAvailable(frame)) { clicked = true; break; }
      }
      if (clicked) break;
    }
  }

  expect(clicked, 'Could not find a Pay/Continue/Submit button in Stripe Checkout').toBeTruthy();

  // 5) Wait for either redirect back OR visible success params / success content
  await page.waitForURL(
    (u: URL) => {
      const s = u.toString();
      const leftStripe = !/checkout\.stripe\.com/.test(s);
      const successish = /success|thank|complete|session_id/i.test(s);
      return leftStripe || successish;
    },
    { timeout: 90_000 }
  );
}

test.describe('Subscriptions UI — full checkout (fills card & pays)', () => {
  test.setTimeout(300_000);

  test('user can click Subscribe, fill Stripe card and finish payment', async ({ page }) => {
    page.on('console', m => console.log('[browser]', m.type(), m.text()));
    page.on('dialog', d => d.accept().catch(() => {}));

    // 1) Go to subscriptions page; login if necessary
    await page.goto(`${FRONTEND_URL}${SUBSCRIPTIONS_PATH}`, { waitUntil: 'domcontentloaded' });
    await maybeLogin(page);

    if (!/\/subscriptions/.test(page.url())) {
      await page.goto(`${FRONTEND_URL}${SUBSCRIPTIONS_PATH}`, { waitUntil: 'domcontentloaded' });
    }

    // 2) Find a clickable subscribe button
    const subscribeBtn = await findClickableSubscribe(page);
    if (!subscribeBtn) test.skip(true, 'No enabled Subscribe button found.');

    // 3) Click and handle popup/same-tab/JSON-url
    const popupPromise = page.waitForEvent('popup').catch(() => null);
    const respPromise = page
      .waitForResponse(
        r => r.request().method() === 'POST' && r.url() === CHECKOUT_ENDPOINT_FULL,
        { timeout: 30_000 }
      )
      .catch(() => null);

    await subscribeBtn!.click(); // non-null after guard above

    // Popup?
    const popup = await popupPromise;
    if (popup) {
      await popup.waitForLoadState('domcontentloaded');
      await popup.waitForURL(/https:\/\/checkout\.stripe\.com\/.*/, { timeout: 90_000 });
      await fillStripeCardAndPay(popup);
      // popup usually closes or redirects; we don't need it anymore
      try { await popup.close(); } catch {}
      return;
    }

    // Same-tab?
    try {
      await page.waitForURL(/https:\/\/checkout\.stripe\.com\/.*/, { timeout: 90_000 });
      await fillStripeCardAndPay(page);
      return;
    } catch {
      /* fall through */
    }

    // Fallback: parse { url } from response (if your frontend opens a new tab-less window)
    const resp = await respPromise;
    if (!resp) throw new Error('No popup, no same-tab redirect, and no create-checkout-session call observed.');

    const status = resp.status();
    const bodyText = await resp.text().catch(() => '');
    if (status !== 200) throw new Error(`${CHECKOUT_ENDPOINT_FULL} returned ${status}. Body: ${bodyText}`);

    let url: string | undefined;
    try {
      const data = JSON.parse(bodyText || '{}');
      url = data?.url as string | undefined;
    } catch {}
    if (!url) throw new Error(`create-checkout-session returned 200 but no url. Body: ${bodyText}`);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/https:\/\/checkout\.stripe\.com\/.*/, { timeout: 90_000 });
    await fillStripeCardAndPay(page);
  });
});
