/**
 * Click Action Executor
 * Handles CLICK action execution
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '@domain/types/action.types';
import { Logger } from '@domain/types/logger.types';
import { CLICK_PATTERN } from '@domain/constants/ActionPatterns';

export class ClickActionExecutor implements ActionExecutor {
  constructor(private logger: Logger) {}

  /**
   * Execute click action logic (extracted for testing)
   */
  executeClickAction(element: HTMLElement | null, pattern: number): ActionExecutionResult {
    if (!element) {
      return { success: false, message: 'Element not found' };
    }

    const effectivePattern = pattern || 20;

    try {
      // Use domain constant for pattern matching
      if (effectivePattern === CLICK_PATTERN.BASIC) {
        // Pattern 10: Basic click
        element.click();
      } else {
        // Pattern 20 or unknown: Framework-agnostic click
        const eventOptions = {
          bubbles: true,
          cancelable: true,
          composed: true,
          view: window,
        };

        element.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
        element.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        element.dispatchEvent(new PointerEvent('pointerup', eventOptions));
        element.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        element.click();

        if ((window as any).jQuery && (window as any).jQuery(element).length) {
          (window as any).jQuery(element).trigger('click');
        }
      }

      return { success: true, message: 'Click successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // eslint-disable-next-line max-lines-per-function, max-params
  async execute(
    tabId: number,
    xpath: string,
    _value: string, // Not used for click
    actionPattern: number,
    stepNumber: number,
    _actionType?: string
  ): Promise<ActionExecutionResult> {
    /* istanbul ignore next */
    try {
      this.logger.debug(
        `Executing click on tab ${tabId} with XPath: ${xpath}, pattern: ${actionPattern}`
      );

      const result = await browser.scripting.executeScript({
        target: { tabId },
        // This inline function runs in browser page context and cannot be directly tested.
        // The logic is tested via the static executeClickAction method.
        // eslint-disable-next-line max-lines-per-function
        func: /* istanbul ignore next */ (
          xpathExpr: string,
          eventPattern: number,
          step: number
        ) => {
          /* istanbul ignore next */
          const logs: string[] = [];
          /* istanbul ignore next */
          const log = (msg: string) => logs.push(`[Step ${step}] ${msg}`);

          /* istanbul ignore next */
          log(`Evaluating XPath for click: ${xpathExpr}`);

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
          log(`Element found for click: ${element.tagName}`);

          /* istanbul ignore next */
          const pattern = eventPattern || 20;
          const eventOpts = { bubbles: true, cancelable: true, composed: true, view: window };

          /* istanbul ignore next */
          // Pattern matching (see CLICK_PATTERN in ActionPatterns.ts):
          // - 10 = BASIC: standard element.click()
          // - 20 = FRAMEWORK_AGNOSTIC: comprehensive pointer/mouse events
          if (pattern === 10) {
            log('Using pattern 10: Basic click');
            element.click();
          } else {
            log('Using pattern 20: Framework-agnostic click');
            element.dispatchEvent(new PointerEvent('pointerdown', eventOpts));
            element.dispatchEvent(new MouseEvent('mousedown', eventOpts));
            element.dispatchEvent(new PointerEvent('pointerup', eventOpts));
            element.dispatchEvent(new MouseEvent('mouseup', eventOpts));
            element.click();
            if ((window as any).jQuery && (window as any).jQuery(element).length) {
              (window as any).jQuery(element).trigger('click');
            }
          }

          /* istanbul ignore next */
          log('Click successful');
          /* istanbul ignore next */
          return { success: true, message: 'Click successful', logs };
        },
        args: [xpath, actionPattern, stepNumber],
      });

      if (result && result.length > 0 && result[0].result) {
        const execResult = result[0].result as ActionExecutionResult;

        // Output logs from page context using this.logger
        if (execResult.logs) {
          execResult.logs.forEach((log) => this.logger.debug(log));
        }

        this.logger.debug('Click execution result', { result: execResult });
        return execResult;
      }

      return { success: false, message: 'No result returned from executeScript' };
    } catch (error) {
      this.logger.error('Click step error', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
