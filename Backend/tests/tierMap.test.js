import { describe, it, expect } from 'vitest';

// Ensure env vars before import
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://localhost.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_test_key';

// Price IDs for this test run
process.env.PRICE_INDIVIDUAL_BASIC = 'price_basic_i';
process.env.PRICE_INDIVIDUAL_PLUS = 'price_plus_i';
process.env.PRICE_INDIVIDUAL_ELITE = 'price_elite_i';
process.env.PRICE_CLUB_BASIC = 'price_basic_c';
process.env.PRICE_CLUB_PLUS = 'price_plus_c';
process.env.PRICE_CLUB_ELITE = 'price_elite_c';

// Import AFTER envs are set
import { tierFromPriceId } from '../server/utils/tierMap.js';

describe('tierFromPriceId', () => {
  it('maps individual tiers', () => {
    expect(tierFromPriceId('price_basic_i')).toBe('individual_basic');
    expect(tierFromPriceId('price_plus_i')).toBe('individual_plus');
    expect(tierFromPriceId('price_elite_i')).toBe('individual_elite');
  });

  it('maps club tiers', () => {
    expect(tierFromPriceId('price_basic_c')).toBe('club_basic');
    expect(tierFromPriceId('price_plus_c')).toBe('club_plus');
    expect(tierFromPriceId('price_elite_c')).toBe('club_elite');
  });

  it('returns null for unknown', () => {
    expect(tierFromPriceId('wut')).toBeNull();
  });
});
