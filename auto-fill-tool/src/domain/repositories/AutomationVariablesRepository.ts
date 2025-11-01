/**
 * AutomationVariablesRepository Interface
 * 自動化変数の永続化を抽象化するリポジトリインターフェース
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';

export interface AutomationVariablesRepository {
  getAll(): Promise<AutomationVariables[]>;
  getById(id: string): Promise<AutomationVariables | undefined>;
  getByWebsiteId(websiteId: string): Promise<AutomationVariables[]>;
  save(variables: AutomationVariables): Promise<void>;
  update(variables: AutomationVariables): Promise<void>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
}
