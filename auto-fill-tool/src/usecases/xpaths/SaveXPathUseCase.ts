/**
 * SaveXPathUseCase
 * XPath設定を保存するユースケース
 */

import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
  save(collection: XPathCollection): Promise<void>;
}

export class SaveXPathUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(xpathData: XPathData): Promise<void> {
    const collection = await this.xpathRepository.getAll();
    collection.add(xpathData);
    await this.xpathRepository.save(collection);
  }
}
