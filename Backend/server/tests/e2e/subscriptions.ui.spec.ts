import { test, expect } from '@playwright/test';

/**
 * Frontend location + route.
 * Adjust if your dev server/route differs.
 * Example overrides:
 *   FRONTEND_URL=http://localhost:5174 PRICING_PATH=/plans npx playwright test
 */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PRICING_PATH = process.env.PRICING_PATH || '/pricing';

/**
 * Button selector:
 * We try an accessible-by-role selector first. If your button text differs,
 * set SUBSCRIBE_TEXT=... or add a data-testid and use getByTestId.
 */
const SUBSCRIBE_TEXT = process.env.SUBSCRIBE_TEXT || 'subscribe'; // case-insensitive regex

test.describe('Subscriptions UI', () => {
  test('user can start checkout and see Stripe Checkout', async ({ page }) => {
    // 1) Open pricing page
    await page.goto(`${FRONTEND_URL}${PRICING_PATH}`);

    // 2) Click the Subscribe button and wait for Checkout popup
    const [checkoutPage] = await Promise.all([
      page.waitForEvent('popup'),
      // Try role-based by visible name first:
      page.getByRole('button', { name: new RegExp(SUBSCRIBE_TEXT, 'i') }).click().catch(async () => {
        // Fallback: try a common data-testid if your UI uses it
        const fallbackBtn = page.locator('[data-testid="subscribe-button"]');
        await expect(fallbackBtn).toBeVisible();
        await fallbackBtn.click();
      }),
    ]);

    // 3) The popup should be Stripe Checkout
    await checkoutPage.waitForURL(/https:\/\/checkout\.stripe\.com\/.*/);
    expect(checkoutPage.url(), 'should be on Stripe Checkout domain').toMatch(/checkout\.stripe\.com/);

    // Optional: close popup so the run ends cleanly
    await checkoutPage.close();
  });
});
