/**
 * ActionExecutor Interface
 * アクション実行の抽象化インターフェース
 */

import { XPathData } from '@domain/entities/XPathCollection';

export interface ActionExecutionResult {
  success: boolean;
  errorMessage?: string;
  logs?: string[];
}

export interface ActionExecutor {
  execute(xpath: XPathData, value?: string): Promise<ActionExecutionResult>;
  canHandle(actionType: string): boolean;
}
