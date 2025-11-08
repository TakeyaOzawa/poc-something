/**
 * Domain Value Object Tests: Retry Count
 */

import { RetryCount } from '../RetryCount';

describe('RetryCount', () => {
  describe('constructor', () => {
    test('有効な回数で作成できること', () => {
      const count = new RetryCount(3);
      expect(count.getValue()).toBe(3);
    });

    test('0回で作成できること', () => {
      const count = new RetryCount(0);
      expect(count.getValue()).toBe(0);
    });

    test('無限回(-1)で作成できること', () => {
      const count = new RetryCount(-1);
      expect(count.getValue()).toBe(-1);
    });

    test('小数でエラーが発生すること', () => {
      expect(() => new RetryCount(3.5)).toThrow('Retry count must be an integer');
    });

    test('負の値(-1以外)でエラーが発生すること', () => {
      expect(() => new RetryCount(-2)).toThrow('Retry count must be >= 0 or -1 for infinite');
    });

    test('最大値を超えるとエラーが発生すること', () => {
      expect(() => new RetryCount(101)).toThrow('Retry count must be <= 100');
    });
  });

  describe('isInfinite', () => {
    test('無限回(-1)でtrueを返すこと', () => {
      const count = new RetryCount(-1);
      expect(count.isInfinite()).toBe(true);
    });

    test('有限回でfalseを返すこと', () => {
      const count = new RetryCount(3);
      expect(count.isInfinite()).toBe(false);
    });
  });

  describe('isFinite', () => {
    test('有限回でtrueを返すこと', () => {
      const count = new RetryCount(3);
      expect(count.isFinite()).toBe(true);
    });

    test('無限回(-1)でfalseを返すこと', () => {
      const count = new RetryCount(-1);
      expect(count.isFinite()).toBe(false);
    });
  });

  describe('isDisabled', () => {
    test('0回でtrueを返すこと', () => {
      const count = new RetryCount(0);
      expect(count.isDisabled()).toBe(true);
    });

    test('1回以上でfalseを返すこと', () => {
      const count = new RetryCount(1);
      expect(count.isDisabled()).toBe(false);
    });
  });

  describe('getDisplayString', () => {
    test('無限回で"Infinite"を返すこと', () => {
      const count = new RetryCount(-1);
      expect(count.getDisplayString()).toBe('Infinite');
    });

    test('0回で"Disabled"を返すこと', () => {
      const count = new RetryCount(0);
      expect(count.getDisplayString()).toBe('Disabled');
    });

    test('有限回で数値文字列を返すこと', () => {
      const count = new RetryCount(3);
      expect(count.getDisplayString()).toBe('3');
    });
  });

  describe('shouldRetry', () => {
    test('無限回で常にtrueを返すこと', () => {
      const count = new RetryCount(-1);
      expect(count.shouldRetry(1)).toBe(true);
      expect(count.shouldRetry(100)).toBe(true);
    });

    test('0回で常にfalseを返すこと', () => {
      const count = new RetryCount(0);
      expect(count.shouldRetry(1)).toBe(false);
    });

    test('有限回で適切に判定すること', () => {
      const count = new RetryCount(3);
      expect(count.shouldRetry(1)).toBe(true);
      expect(count.shouldRetry(3)).toBe(true);
      expect(count.shouldRetry(4)).toBe(false);
    });

    test('無効な試行回数でエラーが発生すること', () => {
      const count = new RetryCount(3);
      expect(() => count.shouldRetry(0)).toThrow('Current attempt must be >= 1');
    });
  });

  describe('getRemainingRetries', () => {
    test('無限回で-1を返すこと', () => {
      const count = new RetryCount(-1);
      expect(count.getRemainingRetries(5)).toBe(-1);
    });

    test('有限回で残り回数を正しく計算すること', () => {
      const count = new RetryCount(5);
      expect(count.getRemainingRetries(1)).toBe(4);
      expect(count.getRemainingRetries(3)).toBe(2);
      expect(count.getRemainingRetries(5)).toBe(0);
      expect(count.getRemainingRetries(6)).toBe(0);
    });
  });

  describe('static factory methods', () => {
    test('infinite()で無限回を作成できること', () => {
      const count = RetryCount.infinite();
      expect(count.isInfinite()).toBe(true);
    });

    test('disabled()で0回を作成できること', () => {
      const count = RetryCount.disabled();
      expect(count.isDisabled()).toBe(true);
    });

    test('default()でデフォルト回数を作成できること', () => {
      const count = RetryCount.default();
      expect(count.getValue()).toBe(3);
    });

    test('fromString()で文字列から作成できること', () => {
      expect(RetryCount.fromString('5').getValue()).toBe(5);
      expect(RetryCount.fromString('infinite').isInfinite()).toBe(true);
      expect(RetryCount.fromString('disabled').isDisabled()).toBe(true);
      expect(RetryCount.fromString('-1').isInfinite()).toBe(true);
      expect(RetryCount.fromString('0').isDisabled()).toBe(true);
    });

    test('fromString()で無効な文字列でエラーが発生すること', () => {
      expect(() => RetryCount.fromString('invalid')).toThrow('Invalid retry count string');
    });
  });

  describe('equals', () => {
    test('同じ値でtrueを返すこと', () => {
      const count1 = new RetryCount(3);
      const count2 = new RetryCount(3);
      expect(count1.equals(count2)).toBe(true);
    });

    test('異なる値でfalseを返すこと', () => {
      const count1 = new RetryCount(3);
      const count2 = new RetryCount(5);
      expect(count1.equals(count2)).toBe(false);
    });
  });
});
