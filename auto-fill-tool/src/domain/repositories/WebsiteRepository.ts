/**
 * Domain Repository Interface: Website Repository
 */

import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Result } from '@domain/values/result.value';

export interface WebsiteRepository {
  /**
   * Save website collection to storage
   * @returns Result containing void on success, or Error on failure
   */
  save(collection: WebsiteCollection): Promise<Result<void, Error>>;

  /**
   * Load website collection from storage
   * @returns Result containing WebsiteCollection on success, or Error on failure
   */
  load(): Promise<Result<WebsiteCollection, Error>>;
}
