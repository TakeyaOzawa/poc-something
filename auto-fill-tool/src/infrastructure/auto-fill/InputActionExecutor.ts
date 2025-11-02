/**
 * Input Action Executor
 * Handles TYPE action execution
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '@domain/types/action.types';
import { Logger } from '@domain/types/logger.types';
import { InputPatternService } from '@domain/services/InputPatternService';

export class InputActionExecutor implements ActionExecutor {
  private patternService: InputPatternService;

  constructor(private logger: Logger) {
    this.patternService = new InputPatternService();
  }

  /**
   * Execute input action logic (extracted for testing)
   * This method contains the core input logic that runs in the page context
   */
  executeInputAction(
    element: HTMLElement | null,
    value: string,
    pattern: number
  ): ActionExecutionResult {
    if (!element) {
      return { success: false, message: 'Element not found' };
    }

    try {
      // Business logic: Determine which pattern to use (delegated to domain service)
      if (this.patternService.isBasicPattern(pattern)) {
        this.setValueBasicPattern(element, value);
      } else {
        this.setValueFrameworkAgnostic(element, value);
      }

      return { success: true, message: 'Input successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private setValueBasicPattern(element: HTMLElement, value: string): void {
    element.focus();

    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = value === '1';
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element instanceof HTMLSelectElement) {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private setValueFrameworkAgnostic(element: HTMLElement, value: string): void {
    const isReactLike = this.isReactElement(element);

    if (isReactLike) {
      this.setValueWithNativeSetter(element, value);
    } else {
      this.setValueDirectly(element, value);
    }

    this.dispatchInputEvents(element);
    this.triggerJQuery(element);
  }

  private isReactElement(element: HTMLElement): boolean {
    return !!(
      (element as any)._valueTracker ||
      (element as any).__reactProps$ ||
      (element as any).__reactInternalInstance$
    );
  }

  private setValueWithNativeSetter(element: HTMLElement, value: string): void {
    if (element instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      if (setter) {
        setter.call(element, value);
      } else {
        element.value = value;
      }
    } else if (element instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (setter) {
        setter.call(element, value);
      } else {
        element.value = value;
      }
    } else {
      this.setValueDirectly(element, value);
    }
  }

  private setValueDirectly(element: HTMLElement, value: string): void {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
    } else if (element instanceof HTMLSelectElement) {
      element.value = value;
    }
  }

  private dispatchInputEvents(element: HTMLElement): void {
    const eventOptions = { bubbles: true, cancelable: true, composed: true };
    element.dispatchEvent(new Event('input', eventOptions));
    element.dispatchEvent(new Event('change', eventOptions));
    element.dispatchEvent(new Event('blur', eventOptions));
  }

  private triggerJQuery(element: HTMLElement): void {
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
        `Executing input on tab ${tabId} with XPath: ${xpath}, value: ${value}, pattern: ${actionPattern}`
      );

      const result = await browser.scripting.executeScript({
        target: { tabId },
        // This inline function runs in browser page context and cannot be directly tested.
        // The logic is tested via the static executeInputAction method.
        // eslint-disable-next-line max-lines-per-function, complexity
        func: /* istanbul ignore next */ (
          xpathExpr: string,
          val: string,
          eventPattern: number,
          step: number
        ) => {
          /* istanbul ignore next */
          const logs: string[] = [];
          const log = (msg: string) => logs.push(`[Step ${step}] ${msg}`);

          /* istanbul ignore next */
          // eslint-disable-next-line complexity
          const setBasic = (el: HTMLElement, v: string) => {
            el.focus();
            if (el instanceof HTMLInputElement) {
              if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = v === '1';
                el.dispatchEvent(new Event('change', { bubbles: true }));
              } else {
                el.value = v;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
            } else if (el instanceof HTMLTextAreaElement) {
              el.value = v;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (el instanceof HTMLSelectElement) {
              el.value = v;
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          };

          /* istanbul ignore next */
          // eslint-disable-next-line complexity
          const applyVal = (el: HTMLElement, v: string) => {
            const isR = !!(
              (el as any)._valueTracker ||
              (el as any).__reactProps$ ||
              (el as any).__reactInternalInstance$
            );
            if (isR && el instanceof HTMLInputElement) {
              const s = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
              )?.set;
              s ? s.call(el, v) : (el.value = v);
            } else if (isR && el instanceof HTMLTextAreaElement) {
              const s = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
              )?.set;
              s ? s.call(el, v) : (el.value = v);
            } else if (
              el instanceof HTMLInputElement ||
              el instanceof HTMLTextAreaElement ||
              el instanceof HTMLSelectElement
            ) {
              el.value = v;
            }
          };

          /* istanbul ignore next */
          const fireEvents = (el: HTMLElement) => {
            const o = { bubbles: true, cancelable: true, composed: true };
            el.dispatchEvent(new Event('input', o));
            el.dispatchEvent(new Event('change', o));
            el.dispatchEvent(new Event('blur', o));
            if ((window as any).jQuery && (window as any).jQuery(el).length) {
              (window as any).jQuery(el).trigger('change');
            }
          };

          /* istanbul ignore next */
          const setFramework = (el: HTMLElement, v: string) => {
            applyVal(el, v);
            fireEvents(el);
          };

          /* istanbul ignore next */
          log(`Evaluating XPath: ${xpathExpr}`);

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
          // Pattern matching (see INPUT_PATTERN in ActionPatterns.ts):
          // - 10 = BASIC: standard DOM manipulation (focus, value, input/change events)
          // - 20 = FRAMEWORK_AGNOSTIC: handles React/Vue/Angular (native setters, comprehensive events)
          // See InputPatternService for the domain logic
          if (eventPattern === 10) {
            log('Using pattern 10: Basic input');
            setBasic(element, val);
          } else {
            log(`Using pattern ${eventPattern}: Framework-agnostic input`);
            setFramework(element, val);
          }

          /* istanbul ignore next */
          log(`Input successful, value set to: ${(element as any).value}`);
          /* istanbul ignore next */
          return { success: true, message: 'Input successful', logs };
        },
        args: [xpath, value, actionPattern, stepNumber],
      });

      if (result && result.length > 0 && result[0].result) {
        const execResult = result[0].result as ActionExecutionResult;

        // Output logs from page context using this.logger
        if (execResult.logs) {
          execResult.logs.forEach((log) => this.logger.debug(log));
        }

        this.logger.debug('Input execution result', { result: execResult });
        return execResult;
      }

      return { success: false, message: 'No result returned from executeScript' };
    } catch (error) {
      this.logger.error('Input step error', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
