/**
 * Domain Port Interface: Auto-Fill Port
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { VariableCollection } from '@domain/entities/Variable';
import { AutomationResult } from '@domain/entities/AutomationResult';

export interface AutoFillResult {
  success: boolean;
  processedSteps: number;
  failedStep?: number;
  error?: string;
}

export interface AutoFillPort {
  /**
   * Execute auto-fill sequence based on XPath data
   * @param tabId - Chrome tab ID to execute in
   * @param xpaths - Sorted array of XPath data (by executionOrder)
   * @param url - URL to match against
   * @param variables - Optional variable collection for string replacement
   * @param automationResult - Optional automation result for progress tracking
   * @returns Result of auto-fill execution
   */
  executeAutoFill(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables?: VariableCollection,
    automationResult?: AutomationResult | null
  ): Promise<AutoFillResult>;

  /**
   * Execute auto-fill sequence with progress tracking
   * @param tabId - Chrome tab ID to execute in
   * @param xpaths - Sorted array of XPath data (by executionOrder)
   * @param url - URL to match against
   * @param variables - Optional variable collection for string replacement
   * @param automationResult - Automation result for progress tracking
   * @param startOffset - Starting index (for resume)
   * @returns Result of auto-fill execution
   */
  executeAutoFillWithProgress(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables?: VariableCollection,
    automationResult?: AutomationResult | null,
    startOffset?: number
  ): Promise<AutoFillResult>;
}
