/**
 * DeleteXPathUseCase
 * XPath設定を削除するユースケース
 */

import { XPathCollection } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
  save(collection: XPathCollection): Promise<void>;
}

export class DeleteXPathUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(id: string): Promise<boolean> {
    const collection = await this.xpathRepository.getAll();
    const success = collection.delete(id);
    
    if (success) {
      await this.xpathRepository.save(collection);
    }
    
    return success;
  }
}
