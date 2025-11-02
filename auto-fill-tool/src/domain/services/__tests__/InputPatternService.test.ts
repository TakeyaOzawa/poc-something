/**
 * Unit Tests: Input Pattern Service (Domain Service)
 */

import { InputPatternService } from '../InputPatternService';
import { InputPattern } from '@domain/constants/InputPattern';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('InputPatternService', () => {
  let service: InputPatternService;

  beforeEach(() => {
    service = new InputPatternService();
  });

  describe('isBasicPattern', () => {
    it('should return true for pattern 10 (BASIC)', () => {
      expect(service.isBasicPattern(InputPattern.BASIC)).toBe(true);
      expect(service.isBasicPattern(10)).toBe(true);
    });

    it('should return false for pattern 20 (FRAMEWORK_AGNOSTIC)', () => {
      expect(service.isBasicPattern(InputPattern.FRAMEWORK_AGNOSTIC)).toBe(false);
      expect(service.isBasicPattern(20)).toBe(false);
    });

    it('should return false for other patterns', () => {
      expect(service.isBasicPattern(5)).toBe(false);
      expect(service.isBasicPattern(15)).toBe(false);
      expect(service.isBasicPattern(30)).toBe(false);
      expect(service.isBasicPattern(100)).toBe(false);
    });
  });

  describe('isFrameworkAgnosticPattern', () => {
    it('should return false for pattern 10 (BASIC)', () => {
      expect(service.isFrameworkAgnosticPattern(InputPattern.BASIC)).toBe(false);
      expect(service.isFrameworkAgnosticPattern(10)).toBe(false);
    });

    it('should return true for pattern 20 (FRAMEWORK_AGNOSTIC)', () => {
      expect(service.isFrameworkAgnosticPattern(InputPattern.FRAMEWORK_AGNOSTIC)).toBe(true);
      expect(service.isFrameworkAgnosticPattern(20)).toBe(true);
    });

    it('should return true for other patterns', () => {
      expect(service.isFrameworkAgnosticPattern(5)).toBe(true);
      expect(service.isFrameworkAgnosticPattern(15)).toBe(true);
      expect(service.isFrameworkAgnosticPattern(30)).toBe(true);
      expect(service.isFrameworkAgnosticPattern(100)).toBe(true);
    });
  });

  describe('getPatternDescription', () => {
    it('should return basic pattern description for pattern 10', () => {
      const description = service.getPatternDescription(InputPattern.BASIC);
      expect(description).toBe('Basic input pattern - standard DOM manipulation');
    });

    it('should return framework-agnostic pattern description for pattern 20', () => {
      const description = service.getPatternDescription(InputPattern.FRAMEWORK_AGNOSTIC);
      expect(description).toBe('Framework-agnostic pattern - handles React, Vue, Angular, etc.');
    });

    it('should return framework-agnostic pattern description for other patterns', () => {
      expect(service.getPatternDescription(5)).toBe(
        'Framework-agnostic pattern - handles React, Vue, Angular, etc.'
      );
      expect(service.getPatternDescription(30)).toBe(
        'Framework-agnostic pattern - handles React, Vue, Angular, etc.'
      );
    });
  });

  describe('isValidPattern', () => {
    it('should return true for positive integer patterns', () => {
      expect(service.isValidPattern(1)).toBe(true);
      expect(service.isValidPattern(10)).toBe(true);
      expect(service.isValidPattern(20)).toBe(true);
      expect(service.isValidPattern(100)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(service.isValidPattern(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(service.isValidPattern(-1)).toBe(false);
      expect(service.isValidPattern(-10)).toBe(false);
    });

    it('should return false for non-integer numbers', () => {
      expect(service.isValidPattern(10.5)).toBe(false);
      expect(service.isValidPattern(20.1)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(service.isValidPattern(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(service.isValidPattern(Infinity)).toBe(false);
      expect(service.isValidPattern(-Infinity)).toBe(false);
    });
  });

  describe('Business logic consistency', () => {
    it('should have consistent basic and framework-agnostic pattern determination', () => {
      const patterns = [5, 10, 15, 20, 25, 30];

      patterns.forEach((pattern) => {
        const isBasic = service.isBasicPattern(pattern);
        const isFrameworkAgnostic = service.isFrameworkAgnosticPattern(pattern);

        // They should be mutually exclusive
        expect(isBasic).not.toBe(isFrameworkAgnostic);
      });
    });

    it('should provide descriptions for all valid patterns', () => {
      const patterns = [5, 10, 15, 20, 25, 30];

      patterns.forEach((pattern) => {
        const description = service.getPatternDescription(pattern);
        expect(description).toBeTruthy();
        expect(description.length).toBeGreaterThan(0);
      });
    });
  });
});
