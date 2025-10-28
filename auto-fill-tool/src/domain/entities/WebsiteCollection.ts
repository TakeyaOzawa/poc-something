/**
 * Domain Entity: Website Collection
 * Manages a collection of websites
 */

import { Website, WebsiteData } from './Website';
import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';

export class WebsiteCollection {
  private websites: Map<string, Website>;

  constructor(websites: Website[] = []) {
    this.websites = new Map();
    websites.forEach((website) => {
      this.websites.set(website.getId(), website);
    });
  }

  add(website: Website): WebsiteCollection {
    const newWebsites = new Map(this.websites);
    newWebsites.set(website.getId(), website);
    return new WebsiteCollection(Array.from(newWebsites.values()));
  }

  update(id: string, website: Website): WebsiteCollection {
    if (!this.websites.has(id)) {
      throw new Error(`Website not found: ${id}`);
    }
    const newWebsites = new Map(this.websites);
    newWebsites.set(id, website);
    return new WebsiteCollection(Array.from(newWebsites.values()));
  }

  delete(id: string): WebsiteCollection {
    if (!this.websites.has(id)) {
      throw new Error(`Website not found: ${id}`);
    }
    const newWebsites = new Map(this.websites);
    newWebsites.delete(id);
    return new WebsiteCollection(Array.from(newWebsites.values()));
  }

  getById(id: string): Website | undefined {
    return this.websites.get(id)?.clone();
  }

  getAll(): Website[] {
    return Array.from(this.websites.values()).map((w) => w.clone());
  }

  getAllSortedByUpdatedAt(): Website[] {
    return this.getAll().sort((a, b) => {
      return new Date(b.toData().updatedAt).getTime() - new Date(a.toData().updatedAt).getTime();
    });
  }

  getEditableWebsites(): Website[] {
    return this.getAll().filter((w) => w.isEditable());
  }

  toJSON(): string {
    const data = this.getAll().map((w) => w.toData());
    return JSON.stringify(data);
  }

  static fromJSON(json: string, logger: Logger = new NoOpLogger()): WebsiteCollection {
    try {
      const data: WebsiteData[] = JSON.parse(json);
      const websites = data.map((d) => new Website(d));
      return new WebsiteCollection(websites);
    } catch (error) {
      logger.error('Failed to parse WebsiteCollection JSON', error);
      return new WebsiteCollection();
    }
  }

  static empty(): WebsiteCollection {
    return new WebsiteCollection();
  }
}
