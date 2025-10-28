/**
 * Domain Service: Progress Tracking Service
 * Centralizes progress management business logic
 */

import { ProgressInfo } from '@domain/types/progress.types';
import { ACTION_TYPE } from '@domain/constants/ActionType';

/**
 * Service for managing automation progress tracking
 * Consolidates progress calculation, formatting, and save decision logic
 */
export class ProgressTrackingService {
  /**
   * Calculate progress information
   *
   * @param current Current step number (1-based)
   * @param total Total number of steps
   * @param actionType Optional action type for description
   * @param customDescription Optional custom description
   * @returns Complete progress information
   *
   * @example
   * ```typescript
   * const service = new ProgressTrackingService();
   * const progress = service.calculateProgress(5, 10, ACTION_TYPE.CLICK);
   * // { current: 5, total: 10, percentage: 50, description: "Executing CLICK action (Step 5/10)" }
   * ```
   */
  calculateProgress(
    current: number,
    total: number,
    actionType?: string,
    customDescription?: string
  ): ProgressInfo {
    // Calculate percentage
    const percentage = total === 0 ? 0 : Math.floor((current / total) * 100);

    // Generate description
    const description = customDescription || this.formatProgressMessage(current, total, actionType);

    return {
      current,
      total,
      percentage,
      description,
    };
  }

  /**
   * Determine if progress should be saved after executing a step
   * Progress is saved after CHANGE_URL actions because page navigation
   * may cause the execution context to be lost
   *
   * @param actionType Action type to check
   * @returns true if progress should be saved, false otherwise
   *
   * @example
   * ```typescript
   * const service = new ProgressTrackingService();
   * service.shouldSaveProgress(ACTION_TYPE.CHANGE_URL); // true
   * service.shouldSaveProgress(ACTION_TYPE.CLICK); // false
   * ```
   */
  shouldSaveProgress(actionType: string): boolean {
    return actionType === ACTION_TYPE.CHANGE_URL;
  }

  /**
   * Format a human-readable progress message
   *
   * @param current Current step number (1-based)
   * @param total Total number of steps
   * @param actionType Optional action type for detailed message
   * @returns Formatted progress message
   *
   * @example
   * ```typescript
   * const service = new ProgressTrackingService();
   * service.formatProgressMessage(3, 10, ACTION_TYPE.TYPE);
   * // "Executing Type action (Step 3/10)"
   *
   * service.formatProgressMessage(5, 10);
   * // "Processing step 5 of 10"
   * ```
   */
  formatProgressMessage(current: number, total: number, actionType?: string): string {
    if (actionType) {
      const actionDesc = this.getActionDescription(actionType);
      return `Executing ${actionDesc} action (Step ${current}/${total})`;
    }
    return `Processing step ${current} of ${total}`;
  }

  /**
   * Get a user-friendly action description
   * Converts action type constants to readable strings
   *
   * @param actionType Action type constant
   * @returns User-friendly action description
   *
   * @example
   * ```typescript
   * const service = new ProgressTrackingService();
   * service.getActionDescription(ACTION_TYPE.TYPE); // "Type"
   * service.getActionDescription(ACTION_TYPE.CHANGE_URL); // "Navigate"
   * ```
   */
  // eslint-disable-next-line complexity -- Required to map all 11 action types (TYPE, CLICK, CHECK, JUDGE, SELECT_VALUE, SELECT_INDEX, SELECT_TEXT, SELECT_TEXT_EXACT, CHANGE_URL, SCREENSHOT, GET_VALUE) to user-friendly descriptions. Each action type needs its own case branch for clarity and maintainability.
  getActionDescription(actionType: string): string {
    switch (actionType) {
      case ACTION_TYPE.TYPE:
        return 'Type';
      case ACTION_TYPE.CLICK:
        return 'Click';
      case ACTION_TYPE.CHECK:
        return 'Check';
      case ACTION_TYPE.JUDGE:
        return 'Validate';
      case ACTION_TYPE.SELECT_VALUE:
      case ACTION_TYPE.SELECT_INDEX:
      case ACTION_TYPE.SELECT_TEXT:
      case ACTION_TYPE.SELECT_TEXT_EXACT:
        return 'Select';
      case ACTION_TYPE.CHANGE_URL:
        return 'Navigate';
      case ACTION_TYPE.SCREENSHOT:
        return 'Screenshot';
      case ACTION_TYPE.GET_VALUE:
        return 'Get value';
      default:
        return 'Process';
    }
  }

  /**
   * Format a detailed progress message with user-friendly action description
   *
   * @param current Current step number (1-based)
   * @param total Total number of steps
   * @param actionType Action type constant
   * @returns Formatted detailed progress message
   *
   * @example
   * ```typescript
   * const service = new ProgressTrackingService();
   * service.formatDetailedProgressMessage(3, 10, ACTION_TYPE.CHANGE_URL);
   * // "Navigate (Step 3/10)"
   * ```
   */
  formatDetailedProgressMessage(current: number, total: number, actionType: string): string {
    const actionDesc = this.getActionDescription(actionType);
    return `${actionDesc} (Step ${current}/${total})`;
  }

  /**
   * Validate progress values
   * Ensures current and total are valid positive numbers
   *
   * @param current Current step number
   * @param total Total number of steps
   * @returns true if values are valid
   *
   * @example
   * ```typescript
   * const service = new ProgressTrackingService();
   * service.isValidProgress(5, 10); // true
   * service.isValidProgress(-1, 10); // false
   * service.isValidProgress(11, 10); // false
   * ```
   */
  isValidProgress(current: number, total: number): boolean {
    return (
      typeof current === 'number' &&
      typeof total === 'number' &&
      current >= 0 &&
      total > 0 &&
      current <= total
    );
  }
}
