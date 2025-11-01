/**
 * GetAllXPathsUseCase
 * 全XPath設定を取得するユースケース
 */

import { XPathCollection } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
}

export class GetAllXPathsUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(): Promise<XPathCollection> {
    return await this.xpathRepository.getAll();
  }
}
