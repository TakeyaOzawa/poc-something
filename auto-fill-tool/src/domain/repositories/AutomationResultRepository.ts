/**
 * AutomationResultRepository Interface
 * 自動化実行結果の永続化を抽象化するリポジトリインターフェース
 */

import { AutomationResult } from '@domain/entities/AutomationResult';

export interface AutomationResultRepository {
  getAll(): Promise<AutomationResult[]>;
  getById(id: string): Promise<AutomationResult | undefined>;
  getByAutomationVariablesId(automationVariablesId: string): Promise<AutomationResult[]>;
  loadInProgress(websiteId: string): Promise<AutomationResult[]>;
  save(result: AutomationResult): Promise<void>;
  update(result: AutomationResult): Promise<void>;
  delete(id: string): Promise<boolean>;
  deleteOldResults(olderThanDays: number): Promise<number>;
}
