/**
 * Select Action Executor
 * Handles SELECT_* action execution (select element manipulation)
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '@domain/types/action.types';
import { Logger } from '@domain/types/logger.types';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SelectionStrategyService, SelectOption } from '@domain/services/SelectionStrategyService';
import { SelectionStrategy, isSelectionStrategy } from '@domain/constants/SelectionStrategy';
import { ElementValidationService } from '@domain/services/ElementValidationService';
import { isMultipleSelectPattern, requiresWaitForOptions } from '@domain/constants/ActionPatterns';

export class SelectActionExecutor implements ActionExecutor {
  private selectionService: SelectionStrategyService;

  constructor(
    private logger: Logger,
    private systemSettingsRepository: SystemSettingsRepository,
    selectionService?: SelectionStrategyService
  ) {
    this.selectionService = selectionService || new SelectionStrategyService();
  }

  /**
   * Execute select action logic (extracted for testing)
   */
  executeSelectAction(
    element: HTMLElement | null,
    value: string,
    action: string,
    pattern: number
  ): ActionExecutionResult {
    if (!element) {
      return { success: false, message: 'Element not found' };
    }

    const validationResult = this.validateSelectElement(element, pattern);
    if (!validationResult.isValid) {
      return { success: false, message: validationResult.message };
    }

    try {
      const selectElement = element as HTMLSelectElement;

      // Validate action type using domain service
      if (!isSelectionStrategy(action)) {
        return { success: false, message: `Unknown action type: ${action}` };
      }

      // Convert HTMLSelectElement options to domain SelectOption interface
      const options: SelectOption[] = Array.from(selectElement.options).map((opt) => ({
        value: opt.value,
        text: opt.text,
      }));

      // Use domain service to find option index
      const optionIndex = this.selectionService.findOptionIndex(
        options,
        value,
        action as SelectionStrategy
      );

      if (optionIndex === -1) {
        return {
          success: false,
          message: `No matching option found for action=${action}, value="${value}"`,
        };
      }

      const selectedOption = selectElement.options[optionIndex];
      if (!selectedOption) {
        return { success: false, message: `Option at index ${optionIndex} not found` };
      }

      this.applySelection(selectElement, selectedOption, pattern);
      return { success: true, message: `Selected: ${selectedOption.text}` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateSelectElement(
    element: HTMLElement,
    pattern: number
  ): { isValid: boolean; message: string } {
    const elementValidation = new ElementValidationService();

    // Delegate validation logic to domain service
    const isHTMLSelectElement = element instanceof HTMLSelectElement;
    const result = elementValidation.validateSelectElement(isHTMLSelectElement, pattern);

    // Add element tag name to error message for debugging
    if (!result.isValid && !isHTMLSelectElement) {
      return { isValid: false, message: `${result.message}: ${element.tagName}` };
    }

    return result;
  }

  private applySelection(
    element: HTMLSelectElement,
    selectedOption: HTMLOptionElement,
    pattern: number
  ): void {
    // Use domain helper to determine if multiple selection
    const isMultiple = isMultipleSelectPattern(pattern);

    if (isMultiple) {
      selectedOption.selected = true;
    } else {
      element.value = selectedOption.value;
    }

    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // eslint-disable-next-line max-lines-per-function, max-params
  async execute(
    tabId: number,
    xpath: string,
    value: string,
    actionPattern: number,
    stepNumber: number,
    actionType?: string
  ): Promise<ActionExecutionResult> {
    /* istanbul ignore next */
    try {
      this.logger.debug(
        `Executing select on tab ${tabId} with XPath: ${xpath}, value: ${value}, actionType: ${actionType}, actionPattern: ${actionPattern}`
      );

      // Wait for custom select options to load (Pattern 20, 30, 120, 130)
      // Use domain helper to determine if waiting is required
      if (requiresWaitForOptions(actionPattern)) {
        const settingsResult = await this.systemSettingsRepository.load();
        if (settingsResult.isFailure) {
          throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
        }
        const systemSettings = settingsResult.value!;
        const waitTime = systemSettings.getWaitForOptionsMilliseconds();
        this.logger.debug(
          `Waiting ${waitTime}ms for custom select options to load (pattern ${actionPattern})`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const result = await browser.scripting.executeScript({
        target: { tabId },
        // This inline function runs in browser page context and cannot be directly tested.
        // The logic is tested via the static executeSelectAction method.
        // eslint-disable-next-line max-lines-per-function, complexity, max-params
        func: /* istanbul ignore next */ (
          xpathExpr: string,
          val: string,
          action: string,
          eventPattern: number,
          step: number
        ) => {
          /* istanbul ignore next */
          const logs: string[] = [];
          logs.push(`[Step ${step}] Evaluating XPath for select: ${xpathExpr}`);

          /* istanbul ignore next */
          const element = document.evaluate(
            xpathExpr,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue as HTMLElement;
          if (!element) {
            logs.push(`[Step ${step}] Element not found`);
            return { success: false, message: 'Element not found', logs };
          }

          /* istanbul ignore next */
          // Pattern decoding (see ActionPatterns.ts for details):
          // - Hundreds digit: 0 = single, 1 = multiple
          // - Tens digit: 1 = native, 2 = custom, 3 = jQuery
          const isMultiple = Math.floor(eventPattern / 100) === 1;
          const customType = Math.floor((eventPattern % 100) / 10);

          /* istanbul ignore next */
          if (!(element instanceof HTMLSelectElement)) {
            const msg =
              customType === 2
                ? 'Custom select support not yet implemented'
                : customType === 3
                  ? 'jQuery select support not yet implemented'
                  : `Element is not a select: ${element.tagName}`;
            logs.push(`[Step ${step}] ${msg}`);
            return { success: false, message: msg, logs };
          }

          /* istanbul ignore next */
          let selectedOption: HTMLOptionElement | null = null;
          if (action === 'select_value') {
            selectedOption = Array.from(element.options).find((opt) => opt.value === val) || null;
          } else if (action === 'select_index') {
            const idx = parseInt(val, 10);
            selectedOption = element.options[idx] || null;
          } else if (action === 'select_text') {
            selectedOption =
              Array.from(element.options).find((opt) => opt.text.includes(val)) || null;
          } else if (action === 'select_text_exact') {
            selectedOption = Array.from(element.options).find((opt) => opt.text === val) || null;
          }

          /* istanbul ignore next */
          if (!selectedOption) {
            const msg = `No matching option found for action=${action}, value="${val}"`;
            logs.push(`[Step ${step}] ${msg}`);
            return { success: false, message: msg, logs };
          }

          /* istanbul ignore next */
          if (isMultiple) {
            selectedOption.selected = true;
          } else {
            element.value = selectedOption.value;
          }
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('input', { bubbles: true }));
          logs.push(`[Step ${step}] Select successful: ${selectedOption.text}`);
          return { success: true, message: `Selected: ${selectedOption.text}`, logs };
        },
        args: [xpath, value, actionType || 'select_value', actionPattern, stepNumber],
      });

      if (result && result.length > 0 && result[0]?.result) {
        const execResult = result[0]!.result as ActionExecutionResult;

        // Output logs from page context using this.logger
        if (execResult.logs) {
          execResult.logs.forEach((log) => this.logger.debug(log));
        }

        this.logger.debug('Select execution result', { result: execResult });
        return execResult;
      }

      return { success: false, message: 'No result returned from executeScript' };
    } catch (error) {
      this.logger.error('Select step error', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
