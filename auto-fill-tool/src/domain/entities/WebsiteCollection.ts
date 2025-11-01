/**
 * WebsiteCollection Entity
 * Webサイト設定のコレクションを管理するドメインエンティティ
 */

import { Website, WebsiteData } from './Website';

export class WebsiteCollection {
  private websites: Website[] = [];

  constructor(websites: Website[] = []) {
    this.websites = [...websites];
  }

  static create(): WebsiteCollection {
    return new WebsiteCollection();
  }

  static fromData(data: WebsiteData[]): WebsiteCollection {
    const websites = data.map(d => Website.fromData(d));
    return new WebsiteCollection(websites);
  }

  add(website: Website): void {
    this.websites.push(website);
  }

  update(id: string, updates: Partial<WebsiteData>): boolean {
    const website = this.websites.find(w => w.getId() === id);
    if (!website) return false;
    
    website.update(updates);
    return true;
  }

  delete(id: string): boolean {
    const index = this.websites.findIndex(w => w.getId() === id);
    if (index === -1) return false;
    
    this.websites.splice(index, 1);
    return true;
  }

  getById(id: string): Website | undefined {
    return this.websites.find(w => w.getId() === id);
  }

  getAll(): Website[] {
    return [...this.websites];
  }

  getEnabled(): Website[] {
    return this.websites.filter(w => w.getStatus() === 'enabled');
  }

  clear(): void {
    this.websites = [];
  }

  size(): number {
    return this.websites.length;
  }

  toData(): WebsiteData[] {
    return this.websites.map(w => w.toData());
  }
}
