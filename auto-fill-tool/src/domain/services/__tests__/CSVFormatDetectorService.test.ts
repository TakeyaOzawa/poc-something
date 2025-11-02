/**
 * Unit Tests: CSVFormatDetectorService
 */

import { CSVFormatDetectorService } from '../CSVFormatDetectorService';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('CSVFormatDetectorService', () => {
  describe('detectFormat', () => {
    it('should detect XPaths CSV format', () => {
      const csvText =
        'id,value,action_type,url,execution_order,selected_path_pattern\nxpath1,test,click,url,1,smart';

      const format = CSVFormatDetectorService.detectFormat(csvText);

      expect(format).toBe('xpaths');
    });

    it('should detect Websites CSV format', () => {
      const csvText =
        'id,name,status,start_url,variables,updated_at,editable\nwebsite1,Test,enabled,url,{},date,true';

      const format = CSVFormatDetectorService.detectFormat(csvText);

      expect(format).toBe('websites');
    });

    it('should detect Automation Variables CSV format', () => {
      const csvText =
        '"status","updatedAt","variables","websiteId"\n"enabled","date","{}","website1"';

      const format = CSVFormatDetectorService.detectFormat(csvText);

      expect(format).toBe('automation_variables');
    });

    it('should return unknown for unrecognized format', () => {
      const csvText = 'unknown,format\ndata,data';

      const format = CSVFormatDetectorService.detectFormat(csvText);

      expect(format).toBe('unknown');
    });

    it('should return unknown for empty CSV', () => {
      const csvText = '';

      const format = CSVFormatDetectorService.detectFormat(csvText);

      expect(format).toBe('unknown');
    });
  });

  describe('isValidFormat', () => {
    it('should return true for xpaths format', () => {
      expect(CSVFormatDetectorService.isValidFormat('xpaths')).toBe(true);
    });

    it('should return true for websites format', () => {
      expect(CSVFormatDetectorService.isValidFormat('websites')).toBe(true);
    });

    it('should return true for automation_variables format', () => {
      expect(CSVFormatDetectorService.isValidFormat('automation_variables')).toBe(true);
    });

    it('should return false for unknown format', () => {
      expect(CSVFormatDetectorService.isValidFormat('unknown')).toBe(false);
    });
  });

  describe('getFormatName', () => {
    it('should return human-readable name for xpaths', () => {
      expect(CSVFormatDetectorService.getFormatName('xpaths')).toBe('XPaths');
    });

    it('should return human-readable name for websites', () => {
      expect(CSVFormatDetectorService.getFormatName('websites')).toBe('Websites');
    });

    it('should return human-readable name for automation_variables', () => {
      expect(CSVFormatDetectorService.getFormatName('automation_variables')).toBe(
        'Automation Variables'
      );
    });

    it('should return Unknown for unknown format', () => {
      expect(CSVFormatDetectorService.getFormatName('unknown')).toBe('Unknown');
    });
  });
});
