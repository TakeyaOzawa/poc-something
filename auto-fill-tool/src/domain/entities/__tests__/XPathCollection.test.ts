/**
 * Unit Tests: XPathCollection Entity
 */

import { XPathCollection } from '../XPathCollection';
import { createTestXPathData } from '@tests/helpers/testHelpers';

describe('XPathCollection', () => {
  describe('add', () => {
    it('should add a new XPath with auto-generated ID and timestamps', () => {
      const collection = new XPathCollection();

      const updatedCollection = collection.add(
        createTestXPathData({
          value: 'Test Value',
          pathShort: '//*[@id="test"]/div[1]',
          selectedPathPattern: 'smart',
          executionOrder: 1,
          afterWaitSeconds: 0,
        })
      );

      const allXPaths = updatedCollection.getAll();
      const xpath = allXPaths[allXPaths.length - 1];

      expect(xpath.id).toBeDefined();
      expect(xpath.value).toBe('Test Value');
    });
  });

  describe('update', () => {
    it('should update an existing XPath', async () => {
      let collection = new XPathCollection();

      collection = collection.add(createTestXPathData());
      const allXPaths = collection.getAll();
      const xpath = allXPaths[allXPaths.length - 1];

      const updatedCollection = collection.update(xpath.id, {
        value: 'Updated Value',
      });

      const updatedXPath = updatedCollection.get(xpath.id);
      expect(updatedXPath).not.toBeUndefined();
      expect(updatedXPath?.value).toBe('Updated Value');
    });

    it('should throw error when updating non-existent XPath', () => {
      const collection = new XPathCollection();
      expect(() => collection.update('non-existent-id', { value: 'Test' })).toThrow(
        'XPath not found: non-existent-id'
      );
    });
  });

  describe('delete', () => {
    it('should delete an existing XPath', () => {
      let collection = new XPathCollection();

      collection = collection.add(createTestXPathData());
      const allXPaths = collection.getAll();
      const xpath = allXPaths[allXPaths.length - 1];

      const newCollection = collection.delete(xpath.id);
      expect(newCollection.get(xpath.id)).toBeUndefined();
      expect(collection.get(xpath.id)).toBeDefined(); // original unchanged
    });

    it('should throw error when deleting non-existent XPath', () => {
      const collection = new XPathCollection();
      expect(() => collection.delete('non-existent-id')).toThrow(
        'XPath not found: non-existent-id'
      );
    });
  });

  describe('get', () => {
    it('should return an XPath by ID', () => {
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          value: 'Test Value',
        })
      );
      const allXPaths = collection.getAll();
      const xpath = allXPaths[allXPaths.length - 1];

      const retrieved = collection.get(xpath.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.value).toBe('Test Value');
    });

    it('should return undefined for non-existent ID', () => {
      const collection = new XPathCollection();
      const retrieved = collection.get('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all XPaths sorted by execution order (ascending)', async () => {
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          value: 'Value 1',
          executionOrder: 2,
        })
      );

      collection = collection.add(
        createTestXPathData({
          value: 'Value 2',
          executionOrder: 1,
        })
      );

      const all = collection.getAll();
      expect(all).toHaveLength(2);
      // Should be sorted by execution order, ascending
      expect(all[0].value).toBe('Value 2');
      expect(all[0].executionOrder).toBe(1);
      expect(all[1].value).toBe('Value 1');
      expect(all[1].executionOrder).toBe(2);
    });

    it('should return empty array when collection is empty', () => {
      const collection = new XPathCollection();
      const all = collection.getAll();
      expect(all).toEqual([]);
    });
  });
});
