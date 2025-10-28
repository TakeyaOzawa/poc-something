/**
 * Get Value Action Executor
 * Handles GET_VALUE action execution
 * Retrieves element value and makes it available as a variable for subsequent steps
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '../../domain/types/action.types';
import { Logger } from '@domain/types/logger.types';

// Value retrieval patterns
export const GET_VALUE_PATTERN = {
  VALUE: 10, // Pattern 10: Get 'value' attribute (for input, select, textarea)
  TEXT_CONTENT: 20, // Pattern 20: Get textContent
  INNER_TEXT: 30, // Pattern 30: Get innerText
  INNER_HTML: 40, // Pattern 40: Get innerHTML
  DATA_ATTRIBUTE: 50, // Pattern 50: Get custom data attribute (requires value like "data-id")
} as const;

/**
 * Extended result that includes retrieved value
 */
export interface GetValueExecutionResult extends ActionExecutionResult {
  retrievedValue?: string;
  variableName?: string;
}

export class GetValueActionExecutor implements ActionExecutor {
  constructor(private logger: Logger) {}

  // eslint-disable-next-line complexity, max-params, max-lines-per-function -- Retrieves element values using multiple patterns (value, textContent, innerText, innerHTML, data attributes) with comprehensive error handling and logging. The sequential pattern checking and result processing is clear and necessary.
  async execute(
    tabId: number,
    xpath: string,
    value: string, // Variable name (e.g., "userName", "orderId")
    actionPattern: number, // Pattern: 10=value, 20=textContent, 30=innerText, 40=innerHTML, 50=data-*
    stepNumber: number,
    _actionType?: string
  ): Promise<GetValueExecutionResult> {
    try {
      this.logger.info(`[Step ${stepNumber}] Getting value from element`, {
        tabId,
        xpath,
        variableName: value,
        pattern: actionPattern,
      });

      // Validate variable name
      if (!value || value.trim().length === 0) {
        return {
          success: false,
          message: 'Variable name cannot be empty',
        };
      }

      const variableName = value.trim();

      // Execute script in page context to retrieve value
      const result = await browser.scripting.executeScript({
        target: { tabId },
        // eslint-disable-next-line complexity, max-lines-per-function -- Page context function that evaluates XPath and retrieves element value based on pattern (value/textContent/innerText/innerHTML/data-*). The conditional pattern matching with comprehensive error handling is necessary for the feature.
        func: /* istanbul ignore next */ (
          xpathExpr: string,
          pattern: number,
          step: number
        ): GetValueExecutionResult => {
          /* istanbul ignore next */
          const logs: string[] = [];
          /* istanbul ignore next */
          const log = (msg: string) => logs.push(`[Step ${step}] ${msg}`);

          /* istanbul ignore next */
          log(`Evaluating XPath for getValue: ${xpathExpr}`);

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
            log(`Element not found for XPath: ${xpathExpr}`);
            return { success: false, message: 'Element not found', logs };
          }

          /* istanbul ignore next */
          log(`Element found: ${element.tagName}`);

          /* istanbul ignore next */
          let retrievedValue: string | null = null;

          /* istanbul ignore next */
          try {
            // Pattern-based value retrieval
            if (pattern === 10) {
              // Get 'value' attribute
              log('Using pattern 10: Get value attribute');
              retrievedValue = (element as HTMLInputElement).value || null;
            } else if (pattern === 20) {
              // Get textContent
              log('Using pattern 20: Get textContent');
              retrievedValue = element.textContent || null;
            } else if (pattern === 30) {
              // Get innerText
              log('Using pattern 30: Get innerText');
              retrievedValue = element.innerText || null;
            } else if (pattern === 40) {
              // Get innerHTML
              log('Using pattern 40: Get innerHTML');
              retrievedValue = element.innerHTML || null;
            } else if (pattern === 50) {
              // Get first data-* attribute found
              log('Using pattern 50: Get data attribute');
              const dataAttributes = Array.from(element.attributes).filter((attr) =>
                attr.name.startsWith('data-')
              );
              if (dataAttributes.length > 0) {
                retrievedValue = dataAttributes[0].value;
                log(`Found data attribute: ${dataAttributes[0].name} = ${retrievedValue}`);
              } else {
                log('No data attributes found');
              }
            } else {
              // Default: try value, then textContent
              log('Using default pattern: Try value, then textContent');
              retrievedValue = (element as HTMLInputElement).value || element.textContent || null;
            }

            /* istanbul ignore next */
            if (retrievedValue === null || retrievedValue === undefined) {
              log('No value retrieved from element');
              return {
                success: false,
                message: 'Could not retrieve value from element',
                logs,
              };
            }

            /* istanbul ignore next */
            log(
              `Value retrieved: ${retrievedValue.substring(0, 50)}${retrievedValue.length > 50 ? '...' : ''}`
            );

            /* istanbul ignore next */
            return {
              success: true,
              message: 'Value retrieved successfully',
              retrievedValue,
              logs,
            };
          } catch (err) {
            /* istanbul ignore next */
            log(`Error retrieving value: ${err}`);
            /* istanbul ignore next */
            return {
              success: false,
              message: err instanceof Error ? err.message : 'Unknown error',
              logs,
            };
          }
        },
        args: [xpath, actionPattern || 10, stepNumber],
      });

      if (result && result.length > 0 && result[0].result) {
        const execResult = result[0].result as GetValueExecutionResult;

        // Output logs from page context
        if (execResult.logs) {
          execResult.logs.forEach((log) => this.logger.debug(log));
        }

        if (execResult.success && execResult.retrievedValue) {
          // Add variable name to result so ChromeAutoFillAdapter can store it
          execResult.variableName = variableName;

          this.logger.info(`[Step ${stepNumber}] Value retrieved successfully`, {
            variableName,
            valueLength: execResult.retrievedValue.length,
            valuePreview: execResult.retrievedValue.substring(0, 100),
          });
        }

        return execResult;
      }

      return { success: false, message: 'No result returned from executeScript' };
    } catch (error) {
      this.logger.error(`[Step ${stepNumber}] getValue step error`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
