import { describe, expect, it } from 'vitest';
import {
  averageRating,
  categoryName,
  formatCents,
  formatCurrency,
  formatDate,
  orderReference,
  primaryImage,
} from '@/shared/lib/format';

/**
 * The formatters are pure functions that every price, date and rating in
 * the UI depends on. A silent `NaN` here shows up as `$NaN` on a product
 * card, so the edge cases matter.
 */
describe('formatCurrency', () => {
  it('formats a number to two decimals', () => {
    expect(formatCurrency(12)).toBe('$12.00');
    expect(formatCurrency(12.5)).toBe('$12.50');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('parses a numeric string', () => {
    expect(formatCurrency('19.99')).toBe('$19.99');
  });

  it('falls back to $0.00 for missing or unparseable values', () => {
    expect(formatCurrency(undefined)).toBe('$0.00');
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency('')).toBe('$0.00');
    expect(formatCurrency('not-a-price')).toBe('$0.00');
  });
});

describe('formatCents', () => {
  it('converts Stripe cents to a currency string', () => {
    expect(formatCents(4242)).toBe('$42.42');
    expect(formatCents(100)).toBe('$1.00');
  });

  it('falls back to $0.00 for a missing amount', () => {
    expect(formatCents(undefined)).toBe('$0.00');
    expect(formatCents(null)).toBe('$0.00');
  });
});

describe('formatDate', () => {
  it('returns an empty string for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('formats a valid ISO date', () => {
    expect(formatDate('2024-03-15T10:00:00.000Z')).toMatch(/2024/);
  });
});

describe('orderReference', () => {
  it('takes the last six characters of the id, uppercased', () => {
    expect(orderReference('507f1f77bcf86cd799439011')).toBe('#439011');
  });

  it('handles a missing id', () => {
    expect(orderReference(undefined)).toBe('#------');
  });
});

describe('primaryImage', () => {
  it('returns the first image', () => {
    expect(primaryImage(['a.jpg', 'b.jpg'])).toBe('a.jpg');
  });

  it('returns undefined when there are no images', () => {
    expect(primaryImage([])).toBeUndefined();
    expect(primaryImage(undefined)).toBeUndefined();
  });
});

describe('averageRating', () => {
  it('averages the star values', () => {
    expect(averageRating([{ star: 5 }, { star: 4 }])).toBe(4.5);
  });

  it('returns 0 when there are no ratings', () => {
    expect(averageRating([])).toBe(0);
    expect(averageRating(undefined)).toBe(0);
  });
});

describe('categoryName', () => {
  it('reads the name from a populated category', () => {
    expect(categoryName({ name: 'Laptops' })).toBe('Laptops');
  });

  it('returns an empty string for an unpopulated id', () => {
    expect(categoryName('507f1f77bcf86cd799439011')).toBe('');
    expect(categoryName(undefined)).toBe('');
  });
});
