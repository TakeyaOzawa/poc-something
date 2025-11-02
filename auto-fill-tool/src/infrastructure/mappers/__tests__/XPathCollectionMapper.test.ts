/**
 * Unit Tests: XPathCollectionMapper
 */

import { XPathCollectionMapper } from '../XPathCollectionMapper';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('XPathCollectionMapper', () => {
  describe('toJSON and fromJSON', () => {
    it('should convert XPathCollection to JSON and back', () => {
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          value: 'Test Value 1',
          executionOrder: 1,
        })
      );

      collection = collection.add(
        createTestXPathData({
          value: 'Test Value 2',
          executionOrder: 2,
        })
      );

      const json = XPathCollectionMapper.toJSON(collection);
      expect(json).toBeDefined();
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].value).toBe('Test Value 1');
      expect(parsed[1].value).toBe('Test Value 2');
    });

    it('should import from JSON', () => {
      let original = new XPathCollection();

      original = original.add(
        createTestXPathData({
          value: 'Test Value',
          url: 'https://example.com',
        })
      );

      const json = XPathCollectionMapper.toJSON(original);
      const imported = XPathCollectionMapper.fromJSON(json);

      const all = imported.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].value).toBe('Test Value');
      expect(all[0].url).toBe('https://example.com');
    });

    it('should throw error when importing invalid JSON', () => {
      expect(() => XPathCollectionMapper.fromJSON('invalid json')).toThrow();
    });

    it('should handle empty collection', () => {
      const collection = new XPathCollection();
      const json = XPathCollectionMapper.toJSON(collection);
      const imported = XPathCollectionMapper.fromJSON(json);

      expect(imported.getAll()).toHaveLength(0);
    });

    it('should exclude id from JSON export', () => {
      const collection = new XPathCollection();
      const updatedCollection = collection.add(
        createTestXPathData({
          value: 'Test Value',
        })
      );

      const json = XPathCollectionMapper.toJSON(updatedCollection);
      const parsed = JSON.parse(json);
      const allXPaths = updatedCollection.getAll();
      const xpath = allXPaths[allXPaths.length - 1];

      expect(parsed[0].id).toBeUndefined();
      expect(xpath.id).toBeDefined(); // Original should still have ID
    });
  });

  describe('toCSV and fromCSV', () => {
    it('should convert XPathCollection to CSV and back', () => {
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          value: 'Test Value 1',
          executionOrder: 1,
        })
      );

      collection = collection.add(
        createTestXPathData({
          value: 'Test Value 2',
          executionOrder: 2,
        })
      );

      const allXPaths = collection.getAll();
      const xpath1 = allXPaths[0];
      const xpath2 = allXPaths[1];

      const csv = XPathCollectionMapper.toCSV(collection);
      expect(csv).toContain('Test Value 1');
      expect(csv).toContain('Test Value 2');

      const imported = XPathCollectionMapper.fromCSV(csv);
      const all = imported.getAll();

      expect(all).toHaveLength(2);
      expect(all[0].id).toBe(xpath1.id); // CSV should preserve IDs
      expect(all[0].value).toBe('Test Value 1');
      expect(all[1].id).toBe(xpath2.id);
      expect(all[1].value).toBe('Test Value 2');
    });

    it('should escape CSV special characters', () => {
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          value: 'Value with, comma',
          pathAbsolute: 'Path with "quotes"',
          pathShort: '//div[@id="test"]',
        })
      );

      const csv = XPathCollectionMapper.toCSV(collection);
      expect(csv).toContain('"Value with, comma"');
      expect(csv).toContain('"Path with ""quotes"""');

      const imported = XPathCollectionMapper.fromCSV(csv);
      const all = imported.getAll();

      expect(all).toHaveLength(1);
      expect(all[0].value).toBe('Value with, comma');
      expect(all[0].pathAbsolute).toBe('Path with "quotes"');
      expect(all[0].pathShort).toBe('//div[@id="test"]');
    });

    it('should throw error for invalid CSV format', () => {
      expect(() => XPathCollectionMapper.fromCSV('')).toThrow('Invalid CSV format');
      expect(() => XPathCollectionMapper.fromCSV('header only')).toThrow('Invalid CSV format');
    });

    it('should skip lines with insufficient columns', () => {
      const mockLogger = {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        setLevel: jest.fn(),
        getLevel: jest.fn(),
        createChild: jest.fn(),
      };

      const csv = [
        'id,website_id,value,action_type,after_wait_seconds,dispatch_event_pattern,path_absolute,path_short,path_smart,selected_path_pattern,retry_type,execution_order,execution_timeout_seconds,url',
        'id1,,,,,,,,,,,,,', // Valid but minimal
        'id2,incomplete', // Invalid - insufficient columns
      ].join('\n');

      const collection = XPathCollectionMapper.fromCSV(csv, mockLogger as any);
      const all = collection.getAll();

      expect(all).toHaveLength(1);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle empty collection CSV', () => {
      const collection = new XPathCollection();
      const csv = XPathCollectionMapper.toCSV(collection);

      // CSV with only header should throw error
      expect(() => XPathCollectionMapper.fromCSV(csv)).toThrow('Invalid CSV format');
    });
  });

  describe('arrayToCSV and arrayFromCSV', () => {
    it('should convert array to CSV and back', () => {
      const xpaths = [
        { ...createTestXPathData({ value: 'Value 1' }), id: 'id1' },
        { ...createTestXPathData({ value: 'Value 2' }), id: 'id2' },
      ];

      const csv = XPathCollectionMapper.arrayToCSV(xpaths);
      expect(csv).toContain('Value 1');
      expect(csv).toContain('Value 2');

      const imported = XPathCollectionMapper.arrayFromCSV(csv);
      expect(imported).toHaveLength(2);
      expect(imported[0].value).toBe('Value 1');
      expect(imported[1].value).toBe('Value 2');
    });
  });
});
