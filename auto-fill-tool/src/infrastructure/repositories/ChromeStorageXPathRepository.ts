/**
 * ChromeStorageXPathRepository
 * Chrome Storage APIを使用したXPath設定リポジトリの実装
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

export class ChromeStorageXPathRepository implements XPathRepository {
  private readonly STORAGE_KEY = 'XPATH_COLLECTION';

  async getAll(): Promise<XPathCollection> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as XPathData[] | undefined;
      return data ? XPathCollection.fromData(data) : XPathCollection.create();
    } catch (error) {
      console.error('Failed to get XPath collection:', error);
      return XPathCollection.create();
    }
  }

  async loadByWebsiteId(websiteId: string): Promise<XPathCollection> {
    const collection = await this.getAll();
    const filteredData = collection.getByWebsiteId(websiteId);
    return XPathCollection.fromData(filteredData);
  }

  async save(collection: XPathCollection): Promise<void> {
    try {
      const data = collection.toData();
      await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to save XPath collection:', error);
      throw new Error('XPath設定の保存に失敗しました');
    }
  }

  async clear(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear XPath collection:', error);
      throw new Error('XPath設定のクリアに失敗しました');
    }
  }
}
