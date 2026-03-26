import { describe, it, expect } from 'vitest';
import { formatPrice } from './formatPrice';

describe('formatPrice', () => {
  it('formats PYG with ₲ prefix', () => {
    const result = formatPrice(150000);
    expect(result).toMatch(/^₲/);
  });

  it('formats zero', () => {
    const result = formatPrice(0);
    expect(result).toMatch(/^₲/);
    expect(result).toContain('0');
  });

  it('accepts string input', () => {
    const numResult = formatPrice(50000);
    const strResult = formatPrice('50000');
    expect(strResult).toBe(numResult);
  });

  it('formats non-PYG currency without ₲', () => {
    const result = formatPrice(100, 'USD');
    expect(result).not.toMatch(/^₲/);
    expect(result).toContain('100');
  });

  it('does not include decimals for PYG', () => {
    const result = formatPrice(1500);
    expect(result).not.toContain(',');
  });
});
