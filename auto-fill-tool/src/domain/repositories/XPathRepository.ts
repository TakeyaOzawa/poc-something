/**
 * XPathRepository Interface
 * XPath設定の永続化を抽象化するリポジトリインターフェース
 */

import { XPathCollection } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
  loadByWebsiteId(websiteId: string): Promise<XPathCollection>;
  save(collection: XPathCollection): Promise<void>;
  clear(): Promise<void>;
}
