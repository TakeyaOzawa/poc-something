/**
 * Infrastructure Layer: Chrome Storage XPath Repository
 * Stores XPath data as CSV string in Chrome local storage
 */

import browser from 'webextension-polyfill';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

export class ChromeStorageXPathRepository implements XPathRepository {
  constructor(private logger: Logger) {}

  async save(collection: XPathCollection): Promise<Result<void, Error>> {
    try {
      const csv = XPathCollectionMapper.toCSV(collection);
      this.logger.info('Saving XPath collection to storage as CSV');
      await browser.storage.local.set({ [STORAGE_KEYS.XPATH_COLLECTION]: csv });
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to save XPath collection', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to save XPath collection')
      );
    }
  }

  async load(): Promise<Result<XPathCollection, Error>> {
    try {
      const result = await browser.storage.local.get(STORAGE_KEYS.XPATH_COLLECTION);
      const csv = result[STORAGE_KEYS.XPATH_COLLECTION];

      if (!csv || typeof csv !== 'string' || csv.trim().length === 0) {
        this.logger.info('No XPath collection found in storage, returning empty collection');
        return Result.success(new XPathCollection());
      }

      this.logger.info('Loading XPath collection from CSV storage');

      try {
        const collection = XPathCollectionMapper.fromCSV(csv, this.logger);
        return Result.success(collection);
      } catch (error) {
        this.logger.error('Failed to parse CSV from storage', error);
        return Result.failure(
          error instanceof Error ? error : new Error('Failed to parse XPath CSV')
        );
      }
    } catch (error) {
      this.logger.error('Failed to load XPath collection', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load XPath collection')
      );
    }
  }

  async loadByWebsiteId(websiteId: string): Promise<Result<XPathData[], Error>> {
    try {
      this.logger.info(`Loading XPaths for website: ${websiteId}`);

      // Load the entire collection
      const collectionResult = await this.load();
      if (collectionResult.isFailure) {
        return Result.failure(collectionResult.error!);
      }

      const collection = collectionResult.value!;
      const xpaths = collection.getByWebsiteId(websiteId);

      this.logger.info(`Found ${xpaths.length} XPaths for website: ${websiteId}`);
      return Result.success(xpaths);
    } catch (error) {
      this.logger.error('Failed to load XPaths by website ID', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load XPaths by website ID')
      );
    }
  }

  // eslint-disable-next-line complexity -- Batch loading requires conditional logic for websiteId filtering, type validation, error handling, and returning either XPathData[] or XPathCollection. This complexity is necessary for the performance optimization (67% reduction in Chrome Storage API calls).
  loadFromBatch(
    rawStorageData: unknown,
    websiteId?: string
  ): Result<XPathData[] | XPathCollection, Error> {
    try {
      this.logger.info('Loading XPath collection from batch data', { websiteId });

      // Validate raw storage data
      if (!rawStorageData || typeof rawStorageData !== 'string') {
        this.logger.info('No XPath data in batch, returning empty collection');
        const emptyCollection = new XPathCollection();
        return websiteId ? Result.success([]) : Result.success(emptyCollection);
      }

      const csv = rawStorageData as string;

      if (csv.trim().length === 0) {
        this.logger.info('Empty XPath CSV in batch, returning empty collection');
        const emptyCollection = new XPathCollection();
        return websiteId ? Result.success([]) : Result.success(emptyCollection);
      }

      // Parse CSV to collection
      try {
        const collection = XPathCollectionMapper.fromCSV(csv, this.logger);

        // If websiteId provided, filter and return XPathData[]
        if (websiteId) {
          const xpaths = collection.getByWebsiteId(websiteId);
          this.logger.info(`Found ${xpaths.length} XPaths for website: ${websiteId}`);
          return Result.success(xpaths);
        }

        // Otherwise return full collection
        return Result.success(collection);
      } catch (error) {
        this.logger.error('Failed to parse CSV from batch data', error);
        return Result.failure(
          error instanceof Error ? error : new Error('Failed to parse XPath CSV from batch')
        );
      }
    } catch (error) {
      this.logger.error('Failed to load XPath collection from batch', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load XPath collection from batch')
      );
    }
  }
}
