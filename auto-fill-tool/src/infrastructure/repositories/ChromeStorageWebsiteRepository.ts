/**
 * Infrastructure Repository: Chrome Storage Website Repository
 */

import browser from 'webextension-polyfill';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

export class ChromeStorageWebsiteRepository implements WebsiteRepository {
  constructor(private logger: Logger) {}

  async save(collection: WebsiteCollection): Promise<Result<void, Error>> {
    try {
      const json = collection.toJSON();
      await browser.storage.local.set({ [STORAGE_KEYS.WEBSITE_CONFIGS]: json });
      this.logger.info('Website collection saved to storage');
      return Result.success<void, Error>(undefined);
    } catch (error) {
      this.logger.error('Failed to save website collection', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save website collection';
      return Result.failure<void, Error>(new Error(errorMessage));
    }
  }

  async load(): Promise<Result<WebsiteCollection, Error>> {
    try {
      this.logger.info('Loading website collection from storage');
      const result = await browser.storage.local.get(STORAGE_KEYS.WEBSITE_CONFIGS);

      if (!result[STORAGE_KEYS.WEBSITE_CONFIGS]) {
        this.logger.info('No website collection found in storage');
        return Result.success(WebsiteCollection.empty());
      }

      const collection = WebsiteCollection.fromJSON(
        result[STORAGE_KEYS.WEBSITE_CONFIGS] as string,
        this.logger
      );
      return Result.success(collection);
    } catch (error) {
      this.logger.error('Failed to load website collection', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load website collection';
      return Result.failure<WebsiteCollection, Error>(new Error(errorMessage));
    }
  }
}
