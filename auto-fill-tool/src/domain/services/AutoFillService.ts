/**
 * AutoFillService Interface
 * 自動入力サービスの抽象化インターフェース
 */

import { XPathCollection } from '@domain/entities/XPathCollection';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationResult } from '@domain/entities/AutomationResult';

export interface AutoFillService {
  executeAutoFill(
    xpaths: XPathCollection,
    variables: AutomationVariables
  ): Promise<void>;

  executeAutoFillWithProgress(
    xpaths: XPathCollection,
    variables: AutomationVariables,
    result: AutomationResult
  ): Promise<void>;
}
