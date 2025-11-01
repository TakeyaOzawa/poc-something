/**
 * ImportXPathsUseCase
 * XPath設定をインポートするユースケース
 */

import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

export interface XPathRepository {
  getAll(): Promise<XPathCollection>;
  save(collection: XPathCollection): Promise<void>;
}

export interface CSVConverter {
  parseXPaths(csvContent: string): Promise<XPathData[]>;
}

export class ImportXPathsUseCase {
  constructor(
    private xpathRepository: XPathRepository,
    private csvConverter: CSVConverter
  ) {}

  async execute(csvContent: string, replaceAll: boolean = false): Promise<{ imported: number; errors: string[] }> {
    try {
      const importedXPaths = await this.csvConverter.parseXPaths(csvContent);
      const collection = replaceAll ? XPathCollection.create() : await this.xpathRepository.getAll();
      
      const errors: string[] = [];
      let imported = 0;

      for (const xpath of importedXPaths) {
        try {
          collection.add(xpath);
          imported++;
        } catch (error) {
          errors.push(`XPath ${xpath.id || 'unknown'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await this.xpathRepository.save(collection);

      return { imported, errors };
    } catch (error) {
      throw new Error(`インポートに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
