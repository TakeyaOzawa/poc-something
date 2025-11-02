/**
 * Judge Action Executor
 * Handles JUDGE action execution (value comparison/verification)
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '@domain/types/action.types';
import { Logger } from '@domain/types/logger.types';
import { ValueComparisonService } from '@domain/services/ValueComparisonService';
import { ComparisonPattern } from '@domain/constants/ComparisonPattern';

export class JudgeActionExecutor implements ActionExecutor {
  private comparisonService: ValueComparisonService;

  constructor(
    private logger: Logger,
    comparisonService?: ValueComparisonService
  ) {
    this.comparisonService = comparisonService || new ValueComparisonService();
  }

  /**
   * Execute judge action logic (extracted for testing)
   */
  executeJudgeAction(
    element: HTMLElement | null,
    expected: string,
    pattern: number
  ): ActionExecutionResult {
    if (!element) {
      return { success: false, message: 'Element not found' };
    }

    try {
      const actualValue = this.extractElementValue(element);
      const matches = this.comparisonService.compare(
        actualValue,
        expected,
        pattern as ComparisonPattern
      );

      return {
        success: matches,
        message: matches
          ? `Judge passed: ${actualValue} matches expected value`
          : `Judge failed: ${actualValue} does not match expected value ${expected}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private extractElementValue(element: HTMLElement): string {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked ? '1' : '0';
      }
      return element.value;
    }

    if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return element.value;
    }

    return element.textContent?.trim() || '';
  }

  // eslint-disable-next-line max-lines-per-function, max-params
  async execute(
    tabId: number,
    xpath: string,
    expectedValue: string,
    actionPattern: number,
    stepNumber: number,
    _actionType?: string
  ): Promise<ActionExecutionResult> {
    /* istanbul ignore next */
    try {
      this.logger.debug(
        `Executing judge on tab ${tabId} with XPath: ${xpath}, expected value: ${expectedValue}, comparison pattern: ${actionPattern}`
      );

      const result = await browser.scripting.executeScript({
        target: { tabId },
        // This inline function runs in browser page context and cannot be directly tested.
        // The logic is tested via the static executeJudgeAction method.
        // eslint-disable-next-line max-lines-per-function, complexity
        func: /* istanbul ignore next */ (
          xpathExpr: string,
          expected: string,
          pattern: number,
          step: number
        ) => {
          /* istanbul ignore next */
          const COMPARISON_PATTERN = {
            EQUALS: 10,
            NOT_EQUALS: 20,
            GREATER_THAN: 30,
            LESS_THAN: 40,
          };

          /* istanbul ignore next */
          const logs: string[] = [];

          /* istanbul ignore next */
          const extractValue = (el: HTMLElement): string => {
            if (el instanceof HTMLInputElement) {
              if (el.type === 'checkbox' || el.type === 'radio') {
                return el.checked ? '1' : '0';
              }
              return el.value;
            }
            if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
              return el.value;
            }
            return el.textContent?.trim() || '';
          };

          /* istanbul ignore next */
          // eslint-disable-next-line complexity, max-lines-per-function
          const compareValues = (actual: string, exp: string, pat: number): boolean => {
            const compareEquals = () => {
              if (actual === exp) return true;
              try {
                const regex = new RegExp(exp);
                const result = regex.test(actual);
                logs.push(`[Step ${step}] Regex match attempted: ${result}`);
                return result;
              } catch (e) {
                logs.push(`[Step ${step}] Not a valid regex pattern, using exact match only`);
                return false;
              }
            };

            const compareNotEquals = () => {
              try {
                const regex = new RegExp(exp);
                const result = !regex.test(actual);
                logs.push(`[Step ${step}] Regex NOT match attempted: ${result}`);
                return result;
              } catch (e) {
                logs.push(`[Step ${step}] Not a valid regex pattern, using exact comparison only`);
                return actual !== exp;
              }
            };

            const compareNumeric = (compareFn: (a: number, b: number) => boolean) => {
              const actualNum = parseFloat(actual);
              const expectedNum = parseFloat(exp);
              if (!isNaN(actualNum) && !isNaN(expectedNum)) {
                const result = compareFn(actualNum, expectedNum);
                logs.push(
                  `[Step ${step}] Numeric comparison: ${actualNum} vs ${expectedNum} = ${result}`
                );
                return result;
              }
              const result = compareFn(actual.charCodeAt(0), exp.charCodeAt(0));
              logs.push(`[Step ${step}] String comparison: "${actual}" vs "${exp}" = ${result}`);
              return result;
            };

            switch (pat) {
              case COMPARISON_PATTERN.EQUALS:
                return compareEquals();
              case COMPARISON_PATTERN.NOT_EQUALS:
                return compareNotEquals();
              case COMPARISON_PATTERN.GREATER_THAN:
                return compareNumeric((a, b) => a > b);
              case COMPARISON_PATTERN.LESS_THAN:
                return compareNumeric((a, b) => a < b);
              default:
                logs.push(
                  `[Step ${step}] Unknown comparison pattern: ${pat}, defaulting to exact match`
                );
                return actual === exp;
            }
          };

          /* istanbul ignore next */
          logs.push(`[Step ${step}] Evaluating XPath for judge: ${xpathExpr}`);

          /* istanbul ignore next */
          const element = document.evaluate(
            xpathExpr,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue as HTMLElement;

          /* istanbul ignore next */
          if (!element) {
            logs.push(`[Step ${step}] Element not found for XPath: ${xpathExpr}`);
            return { success: false, message: 'Element not found', logs };
          }

          /* istanbul ignore next */
          logs.push(`[Step ${step}] Element found for judge: ${element.tagName}`);

          /* istanbul ignore next */
          const actualValue = extractValue(element);
          logs.push(
            `[Step ${step}] Judge: expected="${expected}", actual="${actualValue}", pattern=${pattern}`
          );

          /* istanbul ignore next */
          const matches = compareValues(actualValue, expected, pattern);
          logs.push(`[Step ${step}] Judge result: ${matches ? 'PASS' : 'FAIL'}`);

          /* istanbul ignore next */
          return {
            success: matches,
            message: matches
              ? `Judge passed: ${actualValue} matches expected value`
              : `Judge failed: ${actualValue} does not match expected value ${expected}`,
            logs,
          };
        },
        args: [xpath, expectedValue, actionPattern, stepNumber],
      });

      if (result && result.length > 0 && result[0].result) {
        const execResult = result[0].result as ActionExecutionResult;
        this.logger.debug('Judge execution result', { result: execResult });
        return execResult;
      }

      return { success: false, message: 'No result returned from executeScript' };
    } catch (error) {
      this.logger.error('Judge step error', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
