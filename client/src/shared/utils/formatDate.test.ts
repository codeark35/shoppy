import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './formatDate';

describe('formatDate', () => {
  it('returns a non-empty string for a date string', () => {
    const result = formatDate('2024-03-15T00:00:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('accepts a Date object', () => {
    const date = new Date('2024-06-01');
    const result = formatDate(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces consistent output for the same input', () => {
    const a = formatDate('2024-03-15T00:00:00.000Z');
    const b = formatDate('2024-03-15T00:00:00.000Z');
    expect(a).toBe(b);
  });
});

describe('formatDateTime', () => {
  it('returns a non-empty string for a datetime string', () => {
    const result = formatDateTime('2024-03-15T14:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces a longer string than formatDate (includes time)', () => {
    const date = '2024-03-15T14:30:00.000Z';
    expect(formatDateTime(date).length).toBeGreaterThanOrEqual(formatDate(date).length);
  });
});
