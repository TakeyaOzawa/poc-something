/**
 * AutoFillServiceImpl
 * 自動入力サービスの実装
 */

import { AutoFillService } from '@domain/services/AutoFillService';
import { ActionExecutor } from '@domain/services/ActionExecutor';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationResult } from '@domain/entities/AutomationResult';

export class AutoFillServiceImpl implements AutoFillService {
  private actionExecutors: ActionExecutor[] = [];

  constructor(actionExecutors: ActionExecutor[]) {
    this.actionExecutors = actionExecutors;
  }

  async executeAutoFill(
    xpaths: XPathCollection,
    variables: AutomationVariables
  ): Promise<void> {
    const result = AutomationResult.create(
      variables.getId(),
      variables.getWebsiteId(),
      xpaths.size()
    );
    
    await this.executeAutoFillWithProgress(xpaths, variables, result);
  }

  async executeAutoFillWithProgress(
    xpaths: XPathCollection,
    variables: AutomationVariables,
    result: AutomationResult
  ): Promise<void> {
    try {
      const allXPaths = xpaths.getAll();
      const sortedXPaths = allXPaths.sort((a, b) => a.executionOrder - b.executionOrder);
      
      let executedSteps = 0;
      
      for (let i = 0; i < sortedXPaths.length; i++) {
        const xpath = sortedXPaths[i];
        
        try {
          if (!xpath) {
            throw new Error('XPath設定が見つかりません');
          }
          
          // 変数置換
          const processedValue = this.replaceVariables(xpath.value || '', variables);
          
          // 適切なExecutorを取得
          const executor = this.getExecutor(xpath.actionType);
          if (!executor) {
            throw new Error(`未対応のアクションタイプ: ${xpath.actionType}`);
          }
          
          // アクション実行
          const executionResult = await executor.execute(xpath, processedValue);
          
          if (!executionResult.success) {
            throw new Error(executionResult.errorMessage || 'アクション実行に失敗しました');
          }
          
          executedSteps++;
          
          // 進捗更新
          if (xpath) {
            result.updateProgress(executedSteps, i + 1, xpath.url);
            
            // 待機時間
            if (xpath.afterWaitSeconds && xpath.afterWaitSeconds > 0) {
              await this.wait(xpath.afterWaitSeconds * 1000);
            }
          }
          
        } catch (error) {
          console.error(`XPath execution failed:`, error);
          
          // リトライ処理
          if (xpath && xpath.retryType === 10) {
            // リトライ実装は省略（実際の実装では詳細なリトライロジックが必要）
            throw error;
          } else {
            throw error;
          }
        }
      }
      
      result.markAsSuccess();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.markAsFailed(errorMessage);
      throw error;
    }
  }

  private getExecutor(actionType: string): ActionExecutor | undefined {
    return this.actionExecutors.find(executor => executor.canHandle(actionType));
  }

  private replaceVariables(value: string, variables: AutomationVariables): string {
    let result = value;
    
    // {{variable_name}} 形式の変数を置換
    const variablePattern = /\{\{([^}]+)\}\}/g;
    result = result.replace(variablePattern, (match, variableName) => {
      const variableValue = variables.getVariableValue(variableName.trim());
      return variableValue !== undefined ? variableValue : match;
    });
    
    return result;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
