/**
 * Unit Tests: ElementValidationService
 */

import { ElementValidationService } from '../ElementValidationService';

describe('ElementValidationService', () => {
  let service: ElementValidationService;

  beforeEach(() => {
    service = new ElementValidationService();
  });

  describe('validateElementExists', () => {
    it('should succeed when element exists', () => {
      const element = { id: 'test' };
      const result = service.validateElementExists(element);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(element);
    });

    it('should fail when element is null', () => {
      const result = service.validateElementExists(null);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Element not found');
    });

    it('should fail when element is undefined', () => {
      const result = service.validateElementExists(undefined);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Element not found');
    });

    it('should preserve element type', () => {
      const element = { name: 'test', value: 123 };
      const result = service.validateElementExists(element);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe(element);
    });
  });

  describe('getSelectTypeFromPattern', () => {
    it('should return 1 for native select (pattern 10)', () => {
      expect(service.getSelectTypeFromPattern(10)).toBe(1);
    });

    it('should return 2 for custom select (pattern 20)', () => {
      expect(service.getSelectTypeFromPattern(20)).toBe(2);
    });

    it('should return 3 for jQuery select (pattern 30)', () => {
      expect(service.getSelectTypeFromPattern(30)).toBe(3);
    });

    it('should return 1 for native multiple select (pattern 110)', () => {
      expect(service.getSelectTypeFromPattern(110)).toBe(1);
    });

    it('should return 2 for custom multiple select (pattern 120)', () => {
      expect(service.getSelectTypeFromPattern(120)).toBe(2);
    });

    it('should return 3 for jQuery multiple select (pattern 130)', () => {
      expect(service.getSelectTypeFromPattern(130)).toBe(3);
    });

    it('should calculate type from pattern formula', () => {
      // Formula: Math.floor((pattern % 100) / 10)
      expect(service.getSelectTypeFromPattern(5)).toBe(0);
      expect(service.getSelectTypeFromPattern(15)).toBe(1);
      expect(service.getSelectTypeFromPattern(25)).toBe(2);
      expect(service.getSelectTypeFromPattern(35)).toBe(3);
    });
  });

  describe('validateSelectElement', () => {
    it('should succeed for HTMLSelectElement', () => {
      const result = service.validateSelectElement(true, 10);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    it('should fail for custom select component (type 2)', () => {
      const result = service.validateSelectElement(false, 20);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Custom select component support not yet implemented');
    });

    it('should fail for jQuery select component (type 3)', () => {
      const result = service.validateSelectElement(false, 30);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('jQuery select component support not yet implemented');
    });

    it('should fail for non-select element with native pattern', () => {
      const result = service.validateSelectElement(false, 10);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Element is not a select element');
    });

    it('should succeed for HTMLSelectElement with multiple select pattern', () => {
      const result = service.validateSelectElement(true, 110);

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    it('should fail for custom multiple select (pattern 120)', () => {
      const result = service.validateSelectElement(false, 120);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Custom select component support not yet implemented');
    });

    it('should fail for jQuery multiple select (pattern 130)', () => {
      const result = service.validateSelectElement(false, 130);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('jQuery select component support not yet implemented');
    });
  });

  describe('processExtractedValue', () => {
    describe('input elements', () => {
      it('should return "1" for checked checkbox', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'checkbox',
          checked: true,
        });

        expect(value).toBe('1');
      });

      it('should return "0" for unchecked checkbox', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'checkbox',
          checked: false,
        });

        expect(value).toBe('0');
      });

      it('should return "1" for checked radio', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'radio',
          checked: true,
        });

        expect(value).toBe('1');
      });

      it('should return "0" for unchecked radio', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'radio',
          checked: false,
        });

        expect(value).toBe('0');
      });

      it('should return value for text input', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'text',
          value: 'test value',
        });

        expect(value).toBe('test value');
      });

      it('should return value for email input', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'email',
          value: 'test@example.com',
        });

        expect(value).toBe('test@example.com');
      });

      it('should return empty string for undefined value', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'text',
          value: undefined,
        });

        expect(value).toBe('');
      });
    });

    describe('textarea elements', () => {
      it('should return textarea value', () => {
        const value = service.processExtractedValue({
          elementType: 'textarea',
          value: 'textarea content',
        });

        expect(value).toBe('textarea content');
      });

      it('should return empty string for undefined textarea value', () => {
        const value = service.processExtractedValue({
          elementType: 'textarea',
          value: undefined,
        });

        expect(value).toBe('');
      });
    });

    describe('select elements', () => {
      it('should return select value', () => {
        const value = service.processExtractedValue({
          elementType: 'select',
          value: 'option1',
        });

        expect(value).toBe('option1');
      });

      it('should return empty string for undefined select value', () => {
        const value = service.processExtractedValue({
          elementType: 'select',
          value: undefined,
        });

        expect(value).toBe('');
      });
    });

    describe('other elements', () => {
      it('should return trimmed textContent', () => {
        const value = service.processExtractedValue({
          elementType: 'other',
          textContent: '  text content  ',
        });

        expect(value).toBe('text content');
      });

      it('should return empty string for undefined textContent', () => {
        const value = service.processExtractedValue({
          elementType: 'other',
          textContent: undefined,
        });

        expect(value).toBe('');
      });

      it('should return empty string for empty textContent', () => {
        const value = service.processExtractedValue({
          elementType: 'other',
          textContent: '',
        });

        expect(value).toBe('');
      });

      it('should return empty string for whitespace-only textContent', () => {
        const value = service.processExtractedValue({
          elementType: 'other',
          textContent: '   ',
        });

        expect(value).toBe('');
      });
    });

    describe('edge cases', () => {
      it('should handle undefined checked state as falsy', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          inputType: 'checkbox',
          checked: undefined,
        });

        expect(value).toBe('0');
      });

      it('should handle missing inputType for input element', () => {
        const value = service.processExtractedValue({
          elementType: 'input',
          value: 'test',
        });

        expect(value).toBe('test');
      });
    });
  });
});
