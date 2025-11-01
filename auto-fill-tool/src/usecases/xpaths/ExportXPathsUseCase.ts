/**
 * ExportXPathsUseCase
 * XPath設定をエクスポートするユースケース
 */

import { XPathCollection } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
}

export interface CSVConverter {
  convertXPathsToCSV(collection: XPathCollection): Promise<string>;
}

export class ExportXPathsUseCase {
  constructor(
    private xpathRepository: XPathRepository,
    private csvConverter: CSVConverter
  ) {}

  async execute(): Promise<string> {
    const collection = await this.xpathRepository.getAll();
    return await this.csvConverter.convertXPathsToCSV(collection);
  }
}
