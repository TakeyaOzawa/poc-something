/**
 * XPathCollection Entity Tests
 */

import { XPathCollection, XPathData } from '../XPathCollection';

describe('XPathCollection', () => {
  let collection: XPathCollection;
  let sampleXPath: XPathData;

  beforeEach(() => {
    collection = XPathCollection.create();
    sampleXPath = {
      id: 'test-id',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'input',
      value: 'test value',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0
    };
  });

  describe('create', () => {
    test('空のコレクションが作成されること', () => {
      const newCollection = XPathCollection.create();
      expect(newCollection.size()).toBe(0);
      expect(newCollection.getAll()).toEqual([]);
    });
  });

  describe('fromData', () => {
    test('データからコレクションが作成されること', () => {
      const data = [sampleXPath];
      const newCollection = XPathCollection.fromData(data);
      
      expect(newCollection.size()).toBe(1);
      expect(newCollection.getAll()).toEqual(data);
    });
  });

  describe('add', () => {
    test('XPathが追加されること', () => {
      collection.add(sampleXPath);
      
      expect(collection.size()).toBe(1);
      expect(collection.getById('test-id')).toEqual(sampleXPath);
    });

    test('IDが未設定の場合、自動生成されること', () => {
      const xpathWithoutId = { ...sampleXPath };
      delete xpathWithoutId.id;
      
      collection.add(xpathWithoutId);
      
      expect(collection.size()).toBe(1);
      const added = collection.getAll()[0];
      expect(added.id).toBeDefined();
      expect(added.id).toMatch(/^xpath_\d+_[a-z0-9]+$/);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      collection.add(sampleXPath);
    });

    test('存在するXPathが更新されること', () => {
      const updates = { value: 'updated value', executionOrder: 2 };
      const result = collection.update('test-id', updates);
      
      expect(result).toBe(true);
      const updated = collection.getById('test-id');
      expect(updated?.value).toBe('updated value');
      expect(updated?.executionOrder).toBe(2);
    });

    test('存在しないIDの場合、falseが返されること', () => {
      const result = collection.update('non-existent', { value: 'new value' });
      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      collection.add(sampleXPath);
    });

    test('存在するXPathが削除されること', () => {
      const result = collection.delete('test-id');
      
      expect(result).toBe(true);
      expect(collection.size()).toBe(0);
      expect(collection.getById('test-id')).toBeUndefined();
    });

    test('存在しないIDの場合、falseが返されること', () => {
      const result = collection.delete('non-existent');
      expect(result).toBe(false);
      expect(collection.size()).toBe(1);
    });
  });

  describe('getByWebsiteId', () => {
    test('指定されたWebsiteIdのXPathが取得されること', () => {
      const xpath1 = { ...sampleXPath, id: 'xpath-1', websiteId: 'website-1' };
      const xpath2 = { ...sampleXPath, id: 'xpath-2', websiteId: 'website-2' };
      const xpath3 = { ...sampleXPath, id: 'xpath-3', websiteId: 'website-1' };
      
      collection.add(xpath1);
      collection.add(xpath2);
      collection.add(xpath3);
      
      const result = collection.getByWebsiteId('website-1');
      expect(result).toHaveLength(2);
      expect(result.map(x => x.id)).toEqual(['xpath-1', 'xpath-3']);
    });

    test('該当するWebsiteIdがない場合、空配列が返されること', () => {
      collection.add(sampleXPath);
      const result = collection.getByWebsiteId('non-existent');
      expect(result).toEqual([]);
    });
  });

  describe('clear', () => {
    test('全てのXPathがクリアされること', () => {
      collection.add(sampleXPath);
      collection.add({ ...sampleXPath, id: 'xpath-2' });
      
      expect(collection.size()).toBe(2);
      
      collection.clear();
      
      expect(collection.size()).toBe(0);
      expect(collection.getAll()).toEqual([]);
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      collection.add(sampleXPath);
      const data = collection.toData();
      
      expect(data).toEqual([sampleXPath]);
      expect(data).not.toBe(collection.getAll()); // 異なるインスタンスであること
    });
  });
});
