/**
 * Domain Layer: XPath Repository Interface
 */

import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { Result } from '@domain/values/result.value';

export interface XPathRepository {
  save(collection: XPathCollection): Promise<Result<void, Error>>;
  load(): Promise<Result<XPathCollection, Error>>;

  /**
   * Load XPaths for a specific website
   * @param websiteId - Website ID to filter by
   * @returns XPaths matching the specified website ID, sorted by execution order
   */
  loadByWebsiteId(websiteId: string): Promise<Result<XPathData[], Error>>;

  /**
   * Load XPaths from batch-loaded raw storage data
   * This method enables batch loading optimization by accepting pre-loaded data
   * @param rawStorageData - Raw storage data from batch load (XPathCollection data)
   * @param websiteId - Optional website ID to filter by
   * @returns XPath collection or filtered XPaths if websiteId provided
   */
  loadFromBatch(
    rawStorageData: unknown,
    websiteId?: string
  ): Result<XPathData[] | XPathCollection, Error>;
}
