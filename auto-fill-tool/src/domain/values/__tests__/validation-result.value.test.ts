/**
 * Unit Tests: ValidationResult Type
 */

import { ValidationResult } from '../validation-result.value';

describe('ValidationResult', () => {
  describe('success', () => {
    it('should create a successful validation result', () => {
      const result = ValidationResult.success(42);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe(42);
    });

    it('should work with string values', () => {
      const result = ValidationResult.success('test value');

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('test value');
    });

    it('should work with object values', () => {
      const obj = { name: 'test', value: 123 };
      const result = ValidationResult.success(obj);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(obj);
    });

    it('should throw error when getting error from successful result', () => {
      const result = ValidationResult.success(42);

      expect(() => result.getError()).toThrow('Cannot get error from successful validation');
    });
  });

  describe('failure', () => {
    it('should create a failed validation result', () => {
      const result = ValidationResult.failure<number>('Value must be positive');

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Value must be positive');
    });

    it('should work with different error messages', () => {
      const result = ValidationResult.failure<string>('Field is required');

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Field is required');
    });

    it('should throw error when getting value from failed result', () => {
      const result = ValidationResult.failure<number>('Invalid value');

      expect(() => result.getValue()).toThrow('Cannot get value from failed validation');
    });
  });

  describe('map', () => {
    it('should transform value when successful', () => {
      const result = ValidationResult.success(10);
      const doubled = result.map((x) => x * 2);

      expect(doubled.isValid()).toBe(true);
      expect(doubled.getValue()).toBe(20);
    });

    it('should propagate failure without transformation', () => {
      const result = ValidationResult.failure<number>('Invalid');
      const doubled = result.map((x) => x * 2);

      expect(doubled.isValid()).toBe(false);
      expect(doubled.getError()).toBe('Invalid');
    });

    it('should work with type transformations', () => {
      const result = ValidationResult.success(42);
      const asString = result.map((x) => x.toString());

      expect(asString.isValid()).toBe(true);
      expect(asString.getValue()).toBe('42');
    });

    it('should not execute transformation function on failure', () => {
      const result = ValidationResult.failure<number>('Error');
      const fn = jest.fn((x) => x * 2);

      result.map(fn);

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('flatMap', () => {
    it('should chain validation when successful', () => {
      const validatePositive = (x: number) =>
        x > 0 ? ValidationResult.success(x) : ValidationResult.failure<number>('Must be positive');

      const result = ValidationResult.success(10);
      const chained = result.flatMap(validatePositive);

      expect(chained.isValid()).toBe(true);
      expect(chained.getValue()).toBe(10);
    });

    it('should propagate original failure', () => {
      const validatePositive = (x: number) =>
        x > 0 ? ValidationResult.success(x) : ValidationResult.failure<number>('Must be positive');

      const result = ValidationResult.failure<number>('Initial error');
      const chained = result.flatMap(validatePositive);

      expect(chained.isValid()).toBe(false);
      expect(chained.getError()).toBe('Initial error');
    });

    it('should propagate chained failure', () => {
      const validatePositive = (x: number) =>
        x > 0 ? ValidationResult.success(x) : ValidationResult.failure<number>('Must be positive');

      const result = ValidationResult.success(-5);
      const chained = result.flatMap(validatePositive);

      expect(chained.isValid()).toBe(false);
      expect(chained.getError()).toBe('Must be positive');
    });

    it('should work with type transformations', () => {
      const parseNumber = (s: string) => {
        const n = parseFloat(s);
        return isNaN(n)
          ? ValidationResult.failure<number>('Not a number')
          : ValidationResult.success(n);
      };

      const result = ValidationResult.success('42');
      const parsed = result.flatMap(parseNumber);

      expect(parsed.isValid()).toBe(true);
      expect(parsed.getValue()).toBe(42);
    });

    it('should not execute chained function on failure', () => {
      const result = ValidationResult.failure<number>('Error');
      const fn = jest.fn((x) => ValidationResult.success(x * 2));

      result.flatMap(fn);

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('Railway-Oriented Programming', () => {
    it('should support multiple chained validations', () => {
      const validateNotEmpty = (s: string) =>
        s.trim() ? ValidationResult.success(s.trim()) : ValidationResult.failure<string>('Empty');

      const validateLength = (s: string) =>
        s.length >= 3 ? ValidationResult.success(s) : ValidationResult.failure<string>('Too short');

      const validateNoSpaces = (s: string) =>
        !s.includes(' ')
          ? ValidationResult.success(s)
          : ValidationResult.failure<string>('Contains spaces');

      const result = ValidationResult.success('  hello  ')
        .flatMap(validateNotEmpty)
        .flatMap(validateLength)
        .flatMap(validateNoSpaces);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('hello');
    });

    it('should stop at first failure in chain', () => {
      const validateNotEmpty = (s: string) =>
        s.trim() ? ValidationResult.success(s.trim()) : ValidationResult.failure<string>('Empty');

      const validateLength = (s: string) =>
        s.length >= 3 ? ValidationResult.success(s) : ValidationResult.failure<string>('Too short');

      const validateNoSpaces = (s: string) =>
        !s.includes(' ')
          ? ValidationResult.success(s)
          : ValidationResult.failure<string>('Contains spaces');

      const result = ValidationResult.success('ab') // Too short
        .flatMap(validateNotEmpty)
        .flatMap(validateLength)
        .flatMap(validateNoSpaces);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Too short');
    });

    it('should combine map and flatMap', () => {
      const trim = (s: string) => s.trim();
      const validateLength = (s: string) =>
        s.length >= 3 ? ValidationResult.success(s) : ValidationResult.failure<string>('Too short');

      const result = ValidationResult.success('  hello  ')
        .map(trim) // Transform without validation
        .flatMap(validateLength); // Validate

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('hello');
    });
  });
});
