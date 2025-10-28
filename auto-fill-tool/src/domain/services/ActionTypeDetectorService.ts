/**
 * Domain Service: Action Type Detector
 * Determines the appropriate ActionType based on HTML element information
 */

import { ActionType, ACTION_TYPE } from '@domain/constants/ActionType';

export interface ElementInfo {
  tagName?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Service to detect the appropriate action type based on HTML element information
 * This is a domain service as it contains business logic for determining action types
 */
export class ActionTypeDetectorService {
  /**
   * Determine actionType based on HTML element information
   *
   * Business Rules:
   * - select elements -> SELECT_VALUE
   * - input[type=checkbox] or input[type=radio] -> CHECK
   * - textarea or other input elements -> TYPE
   * - all other elements -> CLICK
   *
   * @param elementInfo - Information about the HTML element
   * @returns The determined ActionType
   */
  static determineActionType(elementInfo?: ElementInfo): ActionType {
    if (!elementInfo?.tagName) {
      return ACTION_TYPE.CLICK;
    }

    const tagName = elementInfo.tagName.toLowerCase();
    const inputType = elementInfo.type?.toString().toLowerCase();

    // selectタグ: select_value
    if (tagName === 'select') {
      return ACTION_TYPE.SELECT_VALUE;
    }

    // inputタグのtype="checkbox"または"radio": check
    if (tagName === 'input' && (inputType === 'checkbox' || inputType === 'radio')) {
      return ACTION_TYPE.CHECK;
    }

    // textareaまたはその他のinputタグ: type
    if (tagName === 'textarea' || tagName === 'input') {
      return ACTION_TYPE.TYPE;
    }

    // その他のタグ: click
    return ACTION_TYPE.CLICK;
  }
}
