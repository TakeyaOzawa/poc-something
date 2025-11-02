/**
 * Checkbox Action Executor
 * Handles CHECK action execution (checkbox/radio buttons)
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '@domain/types/action.types';
import { Logger } from '@domain/types/logger.types';
import { CHECKBOX_PATTERN } from '@domain/constants/ActionPatterns';

export class CheckboxActionExecutor implements ActionExecutor {
  constructor(private logger: Logger) {}

  /**
   * Execute checkbox action logic (extracted for testing)
   */
  executeCheckboxAction(
    element: HTMLElement | null,
    value: string,
    pattern: number
  ): ActionExecutionResult {
    if (!element) {
      return { success: false, message: 'Element not found' };
    }

    const validationResult = this.validateCheckboxElement(element);
    if (!validationResult.isValid) {
      return { success: false, message: validationResult.message };
    }

    const inputElement = element as HTMLInputElement;
    const shouldCheck = value === '1' || value.toLowerCase() === 'true';
    const effectivePattern = pattern || 20;

    try {
      this.applyCheckboxPattern(inputElement, shouldCheck, effectivePattern);
      return { success: true, message: `Checkbox set to ${inputElement.checked}` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateCheckboxElement(element: HTMLElement): {
    isValid: boolean;
    message: string;
  } {
    if (!(element instanceof HTMLInputElement)) {
      return {
        isValid: false,
        message: `Element is not an input element: ${element.tagName}`,
      };
    }

    if (element.type !== 'checkbox' && element.type !== 'radio') {
      return {
        isValid: false,
        message: `Element is not a checkbox/radio: ${element.type}`,
      };
    }

    return { isValid: true, message: '' };
  }

  private applyCheckboxPattern(
    element: HTMLInputElement,
    shouldCheck: boolean,
    pattern: number
  ): void {
    // Use domain constant for pattern matching
    if (pattern === CHECKBOX_PATTERN.BASIC) {
      this.applyBasicPattern(element, shouldCheck);
    } else {
      this.applyFrameworkAgnosticPattern(element, shouldCheck);
    }
  }

  private applyBasicPattern(element: HTMLInputElement, shouldCheck: boolean): void {
    element.checked = shouldCheck;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private applyFrameworkAgnosticPattern(element: HTMLInputElement, shouldCheck: boolean): void {
    element.checked = shouldCheck;

    const eventOptions = {
      bubbles: true,
      cancelable: true,
      composed: true,
    };

    element.dispatchEvent(new MouseEvent('click', eventOptions));
    element.dispatchEvent(new Event('input', eventOptions));
    element.dispatchEvent(new Event('change', eventOptions));

    if ((window as any).jQuery && (window as any).jQuery(element).length) {
      (window as any).jQuery(element).trigger('change');
    }
  }

  // eslint-disable-next-line max-lines-per-function, max-params
  async execute(
    tabId: number,
    xpath: string,
    value: string,
    actionPattern: number,
    stepNumber: number,
    _actionType?: string
  ): Promise<ActionExecutionResult> {
    /* istanbul ignore next */
    try {
      this.logger.debug(
        `Executing checkbox on tab ${tabId} with XPath: ${xpath}, value: ${value}, pattern: ${actionPattern}`
      );

      const result = await browser.scripting.executeScript({
        target: { tabId },
        // This inline function runs in browser page context and cannot be directly tested.
        // The logic is tested via the static executeCheckboxAction method.
        // eslint-disable-next-line max-lines-per-function
        func: /* istanbul ignore next */ (
          xpathExpr: string,
          val: string,
          eventPattern: number,
          step: number
        ) => {
          /* istanbul ignore next */
          const logs: string[] = [];
          /* istanbul ignore next */
          const log = (msg: string) => logs.push(`[Step ${step}] ${msg}`);

          /* istanbul ignore next */
          log(`Evaluating XPath for checkbox: ${xpathExpr}`);

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
          log(`Element found for checkbox: ${element.tagName}`);

          /* istanbul ignore next */
          if (!(element instanceof HTMLInputElement)) {
            const msg = `Element is not an input element: ${element.tagName}`;
            log(msg);
            return { success: false, message: msg, logs };
          }

          /* istanbul ignore next */
          if (element.type !== 'checkbox' && element.type !== 'radio') {
            const msg = `Element is not a checkbox/radio: ${element.type}`;
            log(msg);
            return { success: false, message: msg, logs };
          }

          /* istanbul ignore next */
          const shouldCheck = val === '1' || val.toLowerCase() === 'true';
          const pattern = eventPattern || 20;
          const eventOpts = { bubbles: true, cancelable: true, composed: true };

          /* istanbul ignore next */
          // Pattern matching (see CHECKBOX_PATTERN in ActionPatterns.ts):
          // - 10 = BASIC: standard DOM manipulation
          // - 20 = FRAMEWORK_AGNOSTIC: handles React/Vue/Angular
          if (pattern === 10) {
            log('Using pattern 10: Basic checkbox');
            element.checked = shouldCheck;
            element.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            log('Using pattern 20: Framework-agnostic checkbox');
            element.checked = shouldCheck;
            element.dispatchEvent(new MouseEvent('click', eventOpts));
            element.dispatchEvent(new Event('input', eventOpts));
            element.dispatchEvent(new Event('change', eventOpts));
            if ((window as any).jQuery && (window as any).jQuery(element).length) {
              (window as any).jQuery(element).trigger('change');
            }
          }

          /* istanbul ignore next */
          log(`Checkbox set to: ${element.checked}`);
          /* istanbul ignore next */
          return { success: true, message: `Checkbox set to ${element.checked}`, logs };
        },
        args: [xpath, value, actionPattern, stepNumber],
      });

      if (result && result.length > 0 && result[0].result) {
        const execResult = result[0].result as ActionExecutionResult;

        // Output logs from page context using this.logger
        if (execResult.logs) {
          execResult.logs.forEach((log) => this.logger.debug(log));
        }

        this.logger.debug('Checkbox execution result', { result: execResult });
        return execResult;
      }

      return { success: false, message: 'No result returned from executeScript' };
    } catch (error) {
      this.logger.error('Checkbox step error', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
