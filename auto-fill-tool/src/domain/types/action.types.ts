/**
 * Interface for action executors
 * Each action type (TYPE, CLICK, CHECK, etc.) has its own executor
 */

export interface ActionExecutionResult {
  success: boolean;
  message?: string;
  logs?: string[];
}

export interface ActionExecutor {
  /**
   * Execute the action
   * @param tabId - The tab ID where the action should be executed
   * @param xpath - The XPath expression to locate the element
   * @param value - The value to use for the action (optional, depends on action type)
   * @param actionPattern - The pattern/mode for action execution
   * @param stepNumber - The step number for logging purposes
   * @param actionType - Optional action type (used by SELECT actions)
   * @returns Promise<ActionExecutionResult>
   * @note 6 parameters required for action execution context - max-params exception justified
   */
  // eslint-disable-next-line max-params
  execute(
    tabId: number,
    xpath: string,
    value: string,
    actionPattern: number,
    stepNumber: number,
    actionType?: string
  ): Promise<ActionExecutionResult>;
}
