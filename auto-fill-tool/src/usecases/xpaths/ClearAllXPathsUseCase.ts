/**
 * ClearAllXPathsUseCase
 * 全XPath設定をクリアするユースケース
 */

import { XPathCollection } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  save(collection: XPathCollection): Promise<void>;
}

export class ClearAllXPathsUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(): Promise<void> {
    const emptyCollection = XPathCollection.create();
    await this.xpathRepository.save(emptyCollection);
  }
}
