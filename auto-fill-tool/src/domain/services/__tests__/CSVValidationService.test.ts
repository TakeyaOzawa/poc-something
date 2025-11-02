/**
 * Unit Tests: CSVValidationService
 */

import { CSVValidationService } from '../CSVValidationService';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('CSVValidationService', () => {
  let service: CSVValidationService;

  beforeEach(() => {
    service = new CSVValidationService();
  });

  describe('validateCSVFormat', () => {
    it('should accept valid CSV with header and data rows', () => {
      const csv = 'header1,header2\nvalue1,value2\nvalue3,value4';
      const result = service.validateCSVFormat(csv);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(['header1,header2', 'value1,value2', 'value3,value4']);
    });

    it('should accept CSV with single data row', () => {
      const csv = 'header1,header2\nvalue1,value2';
      const result = service.validateCSVFormat(csv);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toHaveLength(2);
    });

    it('should reject CSV with header only (no data rows)', () => {
      const csv = 'header1,header2';
      const result = service.validateCSVFormat(csv);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Invalid CSV format: no data rows');
    });

    it('should reject empty CSV', () => {
      const csv = '';
      const result = service.validateCSVFormat(csv);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Invalid CSV format: no data rows');
    });

    it('should ignore empty lines', () => {
      const csv = 'header1,header2\n\nvalue1,value2\n\n\nvalue3,value4\n';
      const result = service.validateCSVFormat(csv);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(['header1,header2', 'value1,value2', 'value3,value4']);
    });

    it('should trim whitespace-only lines', () => {
      const csv = 'header1,header2\n   \nvalue1,value2';
      const result = service.validateCSVFormat(csv);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toHaveLength(2);
    });
  });

  describe('validateColumnCount', () => {
    it('should accept values with sufficient columns', () => {
      const values = ['col1', 'col2', 'col3', 'col4', 'col5'];
      const result = service.validateColumnCount(values, 5, 10);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(values);
    });

    it('should accept values with more than minimum columns', () => {
      const values = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6'];
      const result = service.validateColumnCount(values, 5, 10);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(values);
    });

    it('should reject values with insufficient columns', () => {
      const values = ['col1', 'col2', 'col3'];
      const result = service.validateColumnCount(values, 5, 10);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Line 10: insufficient columns (expected 5, got 3)');
    });

    it('should reject empty array', () => {
      const values: string[] = [];
      const result = service.validateColumnCount(values, 5, 10);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Line 10: insufficient columns (expected 5, got 0)');
    });

    it('should include line number in error message', () => {
      const values = ['col1'];
      const result = service.validateColumnCount(values, 3, 42);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('Line 42');
    });
  });

  describe('validateXPathCSVLine', () => {
    it('should accept line with 14 columns', () => {
      const values = new Array(14).fill('value');
      const result = service.validateXPathCSVLine(values, 5);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(values);
    });

    it('should accept line with more than 14 columns', () => {
      const values = new Array(20).fill('value');
      const result = service.validateXPathCSVLine(values, 5);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(values);
    });

    it('should reject line with less than 14 columns', () => {
      const values = new Array(10).fill('value');
      const result = service.validateXPathCSVLine(values, 5);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Line 5: insufficient columns (expected 14, got 10)');
    });

    it('should reject empty line', () => {
      const values: string[] = [];
      const result = service.validateXPathCSVLine(values, 3);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Line 3: insufficient columns (expected 14, got 0)');
    });
  });

  describe('validateWebsiteCSVLine', () => {
    it('should accept line with 5 columns', () => {
      const values = ['id', 'name', 'url', 'date', 'true'];
      const result = service.validateWebsiteCSVLine(values, 10);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(values);
    });

    it('should accept line with more than 5 columns', () => {
      const values = ['id', 'name', 'url', 'date', 'true', 'extra1', 'extra2'];
      const result = service.validateWebsiteCSVLine(values, 10);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toEqual(values);
    });

    it('should reject line with less than 5 columns', () => {
      const values = ['id', 'name', 'url'];
      const result = service.validateWebsiteCSVLine(values, 10);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Line 10: insufficient columns (expected 5, got 3)');
    });

    it('should reject empty line', () => {
      const values: string[] = [];
      const result = service.validateWebsiteCSVLine(values, 7);

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('Line 7: insufficient columns (expected 5, got 0)');
    });
  });

  describe('validateRequiredField', () => {
    it('should accept non-empty value', () => {
      const result = service.validateRequiredField('test value', 'TestField');

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('test value');
    });

    it('should trim whitespace from value', () => {
      const result = service.validateRequiredField('  test value  ', 'TestField');

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('test value');
    });

    it('should reject empty string', () => {
      const result = service.validateRequiredField('', 'TestField');

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('TestField is required and cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const result = service.validateRequiredField('   ', 'TestField');

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toBe('TestField is required and cannot be empty');
    });

    it('should include field name in error message', () => {
      const result = service.validateRequiredField('', 'Username');

      expect(result.isValid()).toBe(false);
      expect(result.getError()).toContain('Username');
    });
  });

  describe('validateOptionalField', () => {
    it('should accept non-empty value', () => {
      const result = service.validateOptionalField('test value');

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('test value');
    });

    it('should trim whitespace from value', () => {
      const result = service.validateOptionalField('  test value  ');

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('test value');
    });

    it('should accept empty string', () => {
      const result = service.validateOptionalField('');

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('');
    });

    it('should convert whitespace-only string to empty', () => {
      const result = service.validateOptionalField('   ');

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('');
    });

    it('should accept undefined as empty string', () => {
      const result = service.validateOptionalField(undefined);

      expect(result.isValid()).toBe(true);
      expect(result.getValue()).toBe('');
    });

    it('should always succeed', () => {
      const testCases = ['test', '', '   ', undefined, 'a', '123'];

      testCases.forEach((testCase) => {
        const result = service.validateOptionalField(testCase);
        expect(result.isValid()).toBe(true);
      });
    });
  });
});
