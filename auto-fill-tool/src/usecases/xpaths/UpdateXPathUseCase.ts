/**
 * UpdateXPathUseCase
 * XPath設定を更新するユースケース
 */

import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
  save(collection: XPathCollection): Promise<void>;
}

export class UpdateXPathUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(id: string, updates: Partial<XPathData>): Promise<boolean> {
    const collection = await this.xpathRepository.getAll();
    const success = collection.update(id, updates);
    
    if (success) {
      await this.xpathRepository.save(collection);
    }
    
    return success;
  }
}
