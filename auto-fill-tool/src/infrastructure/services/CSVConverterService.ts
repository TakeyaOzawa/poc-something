/**
 * CSVConverterService
 * CSV変換サービスの実装
 */

import { CSVConverter } from '@domain/services/CSVConverter';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { Website } from '@domain/entities/Website';
import { SystemSettings } from '@domain/entities/SystemSettings';

export class CSVConverterService implements CSVConverter {
  
  async parseXPaths(csvContent: string): Promise<XPathData[]> {
    try {
      const lines = this.parseCSVLines(csvContent);
      if (lines.length === 0) {
        return [];
      }

      const headers = lines[0];
      if (!headers) {
        throw new Error('CSVヘッダーが見つかりません');
      }
      
      const xpaths: XPathData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (!row || row.length === 0 || row.every(cell => !cell.trim())) {
          continue; // 空行をスキップ
        }

        const xpath: Partial<XPathData> = {};
        
        headers.forEach((header, index) => {
          const value = row[index]?.trim() || '';
          switch (header.toLowerCase()) {
            case 'id':
              xpath.id = value;
              break;
            case 'websiteid':
            case 'website_id':
              xpath.websiteId = value;
              break;
            case 'url':
              xpath.url = value;
              break;
            case 'actiontype':
            case 'action_type':
              xpath.actionType = value;
              break;
            case 'value':
              xpath.value = value;
              break;
            case 'executionorder':
            case 'execution_order':
              xpath.executionOrder = parseInt(value) || 0;
              break;
            case 'shortxpath':
            case 'short_xpath':
              xpath.shortXPath = value;
              break;
            case 'absolutexpath':
            case 'absolute_xpath':
              xpath.absoluteXPath = value;
              break;
            case 'smartxpath':
            case 'smart_xpath':
              xpath.smartXPath = value;
              break;
            case 'selectedpathpattern':
            case 'selected_path_pattern':
              xpath.selectedPathPattern = value || 'smart';
              break;
            case 'retrytype':
            case 'retry_type':
              xpath.retryType = parseInt(value) || 0;
              break;
            case 'actionpattern':
            case 'action_pattern':
              xpath.actionPattern = value;
              break;
          }
        });

        // 必須フィールドのチェック
        if (xpath.websiteId && xpath.url && xpath.actionType !== undefined) {
          xpaths.push(xpath as XPathData);
        }
      }

      return xpaths;
    } catch (error) {
      throw new Error(`XPath CSVの解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async convertXPathsToCSV(collection: XPathCollection): Promise<string> {
    const headers = [
      'id', 'websiteId', 'url', 'actionType', 'value', 'executionOrder',
      'shortXPath', 'absoluteXPath', 'smartXPath', 'selectedPathPattern',
      'retryType', 'actionPattern'
    ];

    const rows = [headers];
    const xpaths = collection.getAll();

    for (const xpath of xpaths) {
      rows.push([
        xpath.id || '',
        xpath.websiteId || '',
        xpath.url || '',
        xpath.actionType || '',
        xpath.value || '',
        (xpath.executionOrder || 0).toString(),
        xpath.shortXPath || '',
        xpath.absoluteXPath || '',
        xpath.smartXPath || '',
        xpath.selectedPathPattern || 'smart',
        (xpath.retryType || 0).toString(),
        xpath.actionPattern || ''
      ]);
    }

    return this.convertToCSV(rows);
  }

  async parseAutomationVariables(_csvContent: string): Promise<AutomationVariables[]> {
    // 簡易実装 - 実際の実装では詳細なパース処理が必要
    throw new Error('AutomationVariables CSV parsing not implemented');
  }

  async convertAutomationVariablesToCSV(_variables: AutomationVariables[]): Promise<string> {
    // 簡易実装 - 実際の実装では詳細な変換処理が必要
    throw new Error('AutomationVariables CSV conversion not implemented');
  }

  async parseWebsites(_csvContent: string): Promise<Website[]> {
    // 簡易実装 - 実際の実装では詳細なパース処理が必要
    throw new Error('Website CSV parsing not implemented');
  }

  async convertWebsitesToCSV(_websites: Website[]): Promise<string> {
    // 簡易実装 - 実際の実装では詳細な変換処理が必要
    throw new Error('Website CSV conversion not implemented');
  }

  async parseSystemSettings(_csvContent: string): Promise<SystemSettings> {
    // 簡易実装 - 実際の実装では詳細なパース処理が必要
    throw new Error('SystemSettings CSV parsing not implemented');
  }

  async convertSystemSettingsToCSV(_settings: SystemSettings): Promise<string> {
    // 簡易実装 - 実際の実装では詳細な変換処理が必要
    throw new Error('SystemSettings CSV conversion not implemented');
  }

  private parseCSVLines(csvContent: string): string[][] {
    const lines = csvContent.split('\n');
    const result: string[][] = [];

    for (const line of lines) {
      if (line.trim()) {
        // 簡易CSV解析（実際の実装ではより堅牢な解析が必要）
        const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        result.push(cells);
      }
    }

    return result;
  }

  private convertToCSV(rows: string[][]): string {
    return rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
}
