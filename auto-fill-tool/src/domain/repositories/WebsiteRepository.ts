/**
 * Domain Repository Interface: Website Repository
 */

import { WebsiteData } from '../entities/Website';

export interface WebsiteRepository {
  findAll(): Promise<WebsiteData[]>;
  findById(id: string): Promise<WebsiteData | null>;
  save(data: WebsiteData): Promise<void>;
  delete(id: string): Promise<void>;
}
