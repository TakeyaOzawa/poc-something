/**
 * ChromeStorageWebsiteRepository
 * Chrome Storage APIを使用したWebsiteリポジトリの実装
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { Website, WebsiteData } from '@domain/entities/Website';

export class ChromeStorageWebsiteRepository implements WebsiteRepository {
  private readonly STORAGE_KEY = 'WEBSITES';

  async getAll(): Promise<Website[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as WebsiteData[] | undefined;
      return data ? data.map(d => Website.fromData(d)) : [];
    } catch (error) {
      console.error('Failed to get websites:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Website | undefined> {
    const allWebsites = await this.getAll();
    return allWebsites.find(w => w.getId() === id);
  }

  async findAll(): Promise<WebsiteData[]> {
    const allWebsites = await this.getAll();
    return allWebsites.map(w => w.toData());
  }

  async findById(id: string): Promise<WebsiteData | null> {
    const website = await this.getById(id);
    return website ? website.toData() : null;
  }

  async save(data: WebsiteData): Promise<void> {
    try {
      const website = Website.fromData(data);
      const allWebsites = await this.getAll();
      allWebsites.push(website);
      await this.saveAll(allWebsites);
    } catch (error) {
      console.error('Failed to save website:', error);
      throw new Error('Webサイト設定の保存に失敗しました');
    }
  }

  async update(website: Website): Promise<void> {
    try {
      const allWebsites = await this.getAll();
      const index = allWebsites.findIndex(w => w.getId() === website.getId());
      
      if (index === -1) {
        throw new Error('更新対象のWebサイト設定が見つかりません');
      }
      
      allWebsites[index] = website;
      await this.saveAll(allWebsites);
    } catch (error) {
      console.error('Failed to update website:', error);
      throw new Error('Webサイト設定の更新に失敗しました');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const allWebsites = await this.getAll();
      const index = allWebsites.findIndex(w => w.getId() === id);
      
      if (index === -1) {
        throw new Error('削除対象のWebサイト設定が見つかりません');
      }
      
      allWebsites.splice(index, 1);
      await this.saveAll(allWebsites);
    } catch (error) {
      console.error('Failed to delete website:', error);
      throw new Error('Webサイト設定の削除に失敗しました');
    }
  }

  async clear(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear websites:', error);
      throw new Error('Webサイト設定のクリアに失敗しました');
    }
  }

  private async saveAll(websites: Website[]): Promise<void> {
    const data = websites.map(w => w.toData());
    await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
  }
}
