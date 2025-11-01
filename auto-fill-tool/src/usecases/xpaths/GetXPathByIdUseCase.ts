/**
 * GetXPathByIdUseCase
 * IDでXPath設定を取得するユースケース
 */

import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
}

export class GetXPathByIdUseCase {
  constructor(private xpathRepository: XPathRepository) {}

  async execute(id: string): Promise<XPathData | undefined> {
    const collection = await this.xpathRepository.getAll();
    return collection.getById(id);
  }
}
