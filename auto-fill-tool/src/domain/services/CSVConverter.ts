/**
 * CSVConverter Interface
 * CSV変換サービスの抽象化インターフェース
 */

import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { Website } from '@domain/entities/Website';
import { SystemSettings } from '@domain/entities/SystemSettings';

export interface CSVConverter {
  // XPath関連
  parseXPaths(csvContent: string): Promise<XPathData[]>;
  convertXPathsToCSV(collection: XPathCollection): Promise<string>;

  // AutomationVariables関連
  parseAutomationVariables(csvContent: string): Promise<AutomationVariables[]>;
  convertAutomationVariablesToCSV(variables: AutomationVariables[]): Promise<string>;

  // Website関連
  parseWebsites(csvContent: string): Promise<Website[]>;
  convertWebsitesToCSV(websites: Website[]): Promise<string>;

  // SystemSettings関連
  parseSystemSettings(csvContent: string): Promise<SystemSettings>;
  convertSystemSettingsToCSV(settings: SystemSettings): Promise<string>;
}
