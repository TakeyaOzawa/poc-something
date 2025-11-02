/**
 * Result Type Tests
 * Tests for generic Result wrapper
 */

import { Result } from '../result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('Result', () => {
  describe('success', () => {
    it('should create a successful result', () => {
      const result = Result.success(42);

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe(42);
      expect(result.error).toBeUndefined();
    });

    it('should create a successful result with undefined value', () => {
      const result = Result.success(undefined);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should create a successful result with null value', () => {
      const result = Result.success(null);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should create a successful result with complex object', () => {
      const data = { id: 1, name: 'test', items: [1, 2, 3] };
      const result = Result.success(data);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(data);
    });
  });

  describe('failure', () => {
    it('should create a failed result with string error', () => {
      const result = Result.failure<number>('Error occurred');

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe('Error occurred');
    });

    it('should create a failed result with custom error type', () => {
      type CustomError = { code: number; message: string };
      const error: CustomError = { code: 404, message: 'Not found' };
      const result = Result.failure<number, CustomError>(error);

      expect(result.isFailure).toBe(true);
      expect(result.error).toEqual(error);
    });

    it('should create a failed result with additional data', () => {
      const result = Result.failure('Validation failed', { field: 'password' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Validation failed');
      expect(result.data).toEqual({ field: 'password' });
    });
  });

  describe('map', () => {
    it('should transform successful result value', () => {
      const result = Result.success(5);
      const mapped = result.map((x) => x * 2);

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it('should not transform failed result', () => {
      const result = Result.failure<number>('Error');
      const mapped = result.map((x) => x * 2);

      expect(mapped.isFailure).toBe(true);
      expect(mapped.error).toBe('Error');
    });

    it('should chain multiple map operations', () => {
      const result = Result.success(10)
        .map((x) => x + 5)
        .map((x) => x * 2)
        .map((x) => x.toString());

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('30');
    });

    it('should preserve error through map chain', () => {
      const result = Result.failure<number>('Initial error')
        .map((x) => x + 5)
        .map((x) => x * 2);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Initial error');
    });
  });

  describe('flatMap', () => {
    it('should chain successful results', () => {
      const result = Result.success(5);
      const flatMapped = result.flatMap((x) => Result.success(x * 2));

      expect(flatMapped.isSuccess).toBe(true);
      expect(flatMapped.value).toBe(10);
    });

    it('should propagate failure from flatMap function', () => {
      const result = Result.success(5);
      const flatMapped = result.flatMap((x) => Result.failure<number>('Inner error'));

      expect(flatMapped.isFailure).toBe(true);
      expect(flatMapped.error).toBe('Inner error');
    });

    it('should not execute flatMap on failed result', () => {
      const result = Result.failure<number>('Outer error');
      const flatMapped = result.flatMap((x) => Result.success(x * 2));

      expect(flatMapped.isFailure).toBe(true);
      expect(flatMapped.error).toBe('Outer error');
    });

    it('should chain multiple flatMap operations', () => {
      const result = Result.success(10)
        .flatMap((x) => Result.success(x + 5))
        .flatMap((x) => Result.success(x * 2))
        .flatMap((x) => Result.success(x.toString()));

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('30');
    });
  });

  describe('match', () => {
    it('should call success handler for successful result', () => {
      const result = Result.success(42);
      const output = result.match({
        success: (value) => `Success: ${value}`,
        failure: (error) => `Failure: ${error}`,
      });

      expect(output).toBe('Success: 42');
    });

    it('should call failure handler for failed result', () => {
      const result = Result.failure<number>('Error occurred');
      const output = result.match({
        success: (value) => `Success: ${value}`,
        failure: (error) => `Failure: ${error}`,
      });

      expect(output).toBe('Failure: Error occurred');
    });

    it('should handle complex transformations in match', () => {
      const result = Result.success({ id: 1, name: 'test' });
      const output = result.match({
        success: (value) => ({ ...value, processed: true }),
        failure: (error) => ({ id: 0, name: 'error', processed: false }),
      });

      expect(output).toEqual({ id: 1, name: 'test', processed: true });
    });
  });

  describe('unwrap', () => {
    it('should return value for successful result', () => {
      const result = Result.success(42);
      expect(result.unwrap()).toBe(42);
    });

    it('should throw error for failed result', () => {
      const result = Result.failure<number>('Error occurred');
      expect(() => result.unwrap()).toThrow('Error occurred');
    });

    it('should throw with custom error message', () => {
      type CustomError = { code: number; message: string };
      const error: CustomError = { code: 404, message: 'Not found' };
      const result = Result.failure<number, CustomError>(error);

      expect(() => result.unwrap()).toThrow();
    });
  });

  describe('unwrapOr', () => {
    it('should return value for successful result', () => {
      const result = Result.success(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    it('should return default value for failed result', () => {
      const result = Result.failure<number>('Error');
      expect(result.unwrapOr(0)).toBe(0);
    });

    it('should work with complex default values', () => {
      const defaultValue = { id: 0, name: 'default' };
      const result = Result.failure<{ id: number; name: string }>('Error');

      expect(result.unwrapOr(defaultValue)).toEqual(defaultValue);
    });
  });

  describe('toString', () => {
    it('should format successful result', () => {
      const result = Result.success(42);
      expect(result.toString()).toBe('Result(success: 42)');
    });

    it('should format failed result', () => {
      const result = Result.failure<number>('Error occurred');
      expect(result.toString()).toBe('Result(failure: Error occurred)');
    });

    it('should handle complex values in toString', () => {
      const result = Result.success({ id: 1, name: 'test' });
      expect(result.toString()).toContain('Result(success:');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle validation flow', () => {
      function validateAge(age: number): Result<number> {
        if (age < 0) return Result.failure('Age cannot be negative');
        if (age > 150) return Result.failure('Age is too high');
        return Result.success(age);
      }

      const validResult = validateAge(25);
      expect(validResult.isSuccess).toBe(true);
      expect(validResult.value).toBe(25);

      const invalidResult = validateAge(-5);
      expect(invalidResult.isFailure).toBe(true);
      expect(invalidResult.error).toBe('Age cannot be negative');
    });

    it('should handle async operations', async () => {
      async function fetchData(id: number): Promise<Result<string>> {
        if (id < 0) return Result.failure('Invalid ID');
        return Result.success(`Data for ID ${id}`);
      }

      const result = await fetchData(42);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('Data for ID 42');

      const errorResult = await fetchData(-1);
      expect(errorResult.isFailure).toBe(true);
    });

    it('should chain multiple operations', () => {
      function parseNumber(str: string): Result<number> {
        const num = parseInt(str, 10);
        return isNaN(num) ? Result.failure('Not a number') : Result.success(num);
      }

      function validatePositive(num: number): Result<number> {
        return num > 0 ? Result.success(num) : Result.failure('Not positive');
      }

      function double(num: number): Result<number> {
        return Result.success(num * 2);
      }

      const result = parseNumber('10').flatMap(validatePositive).flatMap(double);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(20);

      const errorResult = parseNumber('abc').flatMap(validatePositive).flatMap(double);

      expect(errorResult.isFailure).toBe(true);
      expect(errorResult.error).toBe('Not a number');
    });
  });
});
