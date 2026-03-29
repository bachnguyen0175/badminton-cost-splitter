import { describe, it, expect } from 'vitest';
import { roundVnd, formatVnd, formatVndWithExact } from './vndFormat';

describe('roundVnd', () => {
  it('rounds to nearest 1,000 VND', () => {
    expect(roundVnd(166667)).toBe(167000);
    expect(roundVnd(333333)).toBe(333000);
  });

  it('rounds up when remainder is >= 500', () => {
    expect(roundVnd(100500)).toBe(101000);
    expect(roundVnd(100999)).toBe(101000);
    expect(roundVnd(100750)).toBe(101000);
  });

  it('rounds down when remainder is < 500', () => {
    expect(roundVnd(100499)).toBe(100000);
    expect(roundVnd(100001)).toBe(100000);
    expect(roundVnd(100250)).toBe(100000);
  });

  it('handles amount ending in exactly 500 (round-half boundary)', () => {
    // Math.round rounds 0.5 up
    expect(roundVnd(100500)).toBe(101000);
    expect(roundVnd(500)).toBe(1000);
    expect(roundVnd(1500)).toBe(2000);
  });

  it('preserves exact multiples of 1,000', () => {
    expect(roundVnd(100000)).toBe(100000);
    expect(roundVnd(500000)).toBe(500000);
    expect(roundVnd(1000)).toBe(1000);
  });

  it('handles zero', () => {
    expect(roundVnd(0)).toBe(0);
  });

  it('handles very small amounts (< 1000)', () => {
    expect(roundVnd(1)).toBe(0);
    expect(roundVnd(499)).toBe(0);
    expect(roundVnd(500)).toBe(1000);
    expect(roundVnd(999)).toBe(1000);
  });
});

describe('formatVnd', () => {
  it('formats amounts with vi-VN locale (dot as thousands separator)', () => {
    expect(formatVnd(500000)).toBe('500.000đ');
    expect(formatVnd(1000000)).toBe('1.000.000đ');
  });

  it('formats amounts without thousands separator for small numbers', () => {
    expect(formatVnd(100)).toBe('100đ');
    expect(formatVnd(999)).toBe('999đ');
  });

  it('formats zero', () => {
    expect(formatVnd(0)).toBe('0đ');
  });

  it('formats large amounts', () => {
    expect(formatVnd(2469134)).toBe('2.469.134đ');
    expect(formatVnd(10000000)).toBe('10.000.000đ');
  });

  it('formats typical badminton session amounts', () => {
    expect(formatVnd(167000)).toBe('167.000đ');
    expect(formatVnd(300000)).toBe('300.000đ');
    expect(formatVnd(80000)).toBe('80.000đ');
  });
});

describe('formatVndWithExact', () => {
  it('returns only rounded text when exact equals rounded', () => {
    const result = formatVndWithExact(100000, 100000);
    expect(result.roundedText).toBe('100.000đ');
    expect(result.exactText).toBeNull();
    expect(result.showExact).toBe(false);
  });

  it('returns both rounded and exact text when they differ', () => {
    const result = formatVndWithExact(166667, 167000);
    expect(result.roundedText).toBe('167.000đ');
    expect(result.exactText).toBe('166.667đ');
    expect(result.showExact).toBe(true);
  });

  it('handles zero amounts', () => {
    const result = formatVndWithExact(0, 0);
    expect(result.roundedText).toBe('0đ');
    expect(result.exactText).toBeNull();
    expect(result.showExact).toBe(false);
  });
});
