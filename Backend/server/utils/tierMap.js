// server/utils/tierMap.js

/**
 * Maps Stripe price IDs -> your logical tiers.
 * Keep ONLY env lookups so you can change prices per env without code edits.
 */
export function tierFromPriceId(priceId) {
  if (!priceId) return null;

  const map = {
    [process.env.PRICE_INDIVIDUAL_BASIC]: 'individual_basic',
    [process.env.PRICE_INDIVIDUAL_PLUS]: 'individual_plus',
    [process.env.PRICE_INDIVIDUAL_ELITE]: 'individual_elite',
    [process.env.PRICE_CLUB_BASIC]: 'club_basic',
    [process.env.PRICE_CLUB_PLUS]: 'club_plus',
    [process.env.PRICE_CLUB_ELITE]: 'club_elite',
  };

  return map[priceId] ?? null;
}
