/**
 * Domain Service: Step Validation Service
 * Centralizes step execution validation business logic
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { VariableCollection } from '@domain/entities/Variable';
import { ValidationResult } from '@domain/values/validation-result.value';
import { ACTION_TYPE, isActionType } from '@domain/constants/ActionType';
import { EVENT_PATTERN } from '@domain/constants/EventPattern';
import { isComparisonPattern } from '@domain/constants/ComparisonPattern';
import { isSelectPattern } from '@domain/constants/SelectPattern';
import { RETRY_TYPE } from '@domain/constants/RetryType';

/**
 * Service for validating XPath steps before execution
 * Consolidates validation logic to ensure steps are executable
 */
export class StepValidationService {
  /**
   * Validate a step before execution (統合検証)
   * Combines all validation checks into a single method
   *
   * @param xpath XPath step to validate
   * @param variables Variable collection for variable reference validation
   * @returns ValidationResult indicating success or failure with error message
   *
   * @example
   * ```typescript
   * const service = new StepValidationService();
   * const variables = new VariableCollection();
   * const result = service.validateStepBeforeExecution(xpath, variables);
   * if (!result.isValid()) {
   *   console.error(result.getError());
   * }
   * ```
   */
  validateStepBeforeExecution(
    xpath: XPathData,
    _variables: VariableCollection
  ): ValidationResult<void> {
    // Validate XPath pattern
    const xpathResult = this.validateXPathPattern(xpath);
    if (!xpathResult.isValid()) {
      return xpathResult;
    }

    // Validate action type compatibility
    const actionTypeResult = this.validateActionTypeCompatibility(xpath);
    if (!actionTypeResult.isValid()) {
      return actionTypeResult;
    }

    // Validate required fields
    const requiredFieldsResult = this.validateRequiredFields(xpath);
    if (!requiredFieldsResult.isValid()) {
      return requiredFieldsResult;
    }

    // Validate execution configuration
    const executionConfigResult = this.validateExecutionConfiguration(xpath);
    if (!executionConfigResult.isValid()) {
      return executionConfigResult;
    }

    return ValidationResult.success<void>(undefined as void);
  }

  /**
   * Validate XPath pattern fields based on selectedPathPattern
   * Ensures the required path field is non-empty
   *
   * @param xpath XPath step to validate
   * @returns ValidationResult indicating success or failure
   *
   * @example
   * ```typescript
   * const service = new StepValidationService();
   * const result = service.validateXPathPattern(xpath);
   * // Validates pathSmart is non-empty when selectedPathPattern is 'smart'
   * ```
   */
  validateXPathPattern(xpath: XPathData): ValidationResult<void> {
    const { selectedPathPattern } = xpath;

    // Validate based on selected path pattern
    switch (selectedPathPattern) {
      case 'short':
        if (!xpath.pathShort || xpath.pathShort.trim() === '') {
          return ValidationResult.failure<void>(
            'pathShort is required when selectedPathPattern is "short"'
          );
        }
        break;

      case 'absolute':
        if (!xpath.pathAbsolute || xpath.pathAbsolute.trim() === '') {
          return ValidationResult.failure<void>(
            'pathAbsolute is required when selectedPathPattern is "absolute"'
          );
        }
        break;

      case 'smart':
        if (!xpath.pathSmart || xpath.pathSmart.trim() === '') {
          return ValidationResult.failure<void>(
            'pathSmart is required when selectedPathPattern is "smart"'
          );
        }
        break;

      default:
        return ValidationResult.failure<void>(
          `Invalid selectedPathPattern: ${selectedPathPattern}`
        );
    }

    return ValidationResult.success<void>(undefined as void);
  }

  /**
   * Validate action type and action pattern compatibility
   * Ensures actionPattern is valid for the given actionType
   *
   * @param xpath XPath step to validate
   * @returns ValidationResult indicating success or failure
   *
   * @example
   * ```typescript
   * const service = new StepValidationService();
   * const result = service.validateActionTypeCompatibility(xpath);
   * // Validates EVENT_PATTERN for TYPE/CLICK/CHECK actions
   * ```
   */
  // eslint-disable-next-line complexity -- Required for comprehensive action type validation across 11 different action types (TYPE, CLICK, CHECK, JUDGE, SELECT_VALUE, SELECT_INDEX, SELECT_TEXT, SELECT_TEXT_EXACT, CHANGE_URL, SCREENSHOT, GET_VALUE), each with specific actionPattern requirements
  validateActionTypeCompatibility(xpath: XPathData): ValidationResult<void> {
    const { actionType, actionPattern } = xpath;

    // Validate actionType is valid
    if (!isActionType(actionType)) {
      return ValidationResult.failure<void>(`Invalid actionType: ${actionType}`);
    }

    // actionPattern as number for pattern validation
    const patternNumber = typeof actionPattern === 'number' ? actionPattern : 0;

    // Validate based on action type
    switch (actionType) {
      case ACTION_TYPE.TYPE:
      case ACTION_TYPE.CLICK:
      case ACTION_TYPE.CHECK:
        // Must be EVENT_PATTERN (10 or 20)
        if (
          patternNumber !== EVENT_PATTERN.BASIC &&
          patternNumber !== EVENT_PATTERN.FRAMEWORK_AGNOSTIC
        ) {
          return ValidationResult.failure<void>(
            `actionPattern must be EVENT_PATTERN (10 or 20) for ${actionType} action, got ${patternNumber}`
          );
        }
        break;

      case ACTION_TYPE.JUDGE:
        // Must be COMPARISON_PATTERN (10, 20, 30, 40)
        if (!isComparisonPattern(patternNumber)) {
          return ValidationResult.failure<void>(
            `actionPattern must be COMPARISON_PATTERN (10, 20, 30, 40) for JUDGE action, got ${patternNumber}`
          );
        }
        break;

      case ACTION_TYPE.SELECT_VALUE:
      case ACTION_TYPE.SELECT_INDEX:
      case ACTION_TYPE.SELECT_TEXT:
      case ACTION_TYPE.SELECT_TEXT_EXACT:
        // Must be SELECT_PATTERN (10, 20, 30, 110, 120, 130)
        if (!isSelectPattern(patternNumber)) {
          return ValidationResult.failure<void>(
            `actionPattern must be SELECT_PATTERN for ${actionType} action, got ${patternNumber}`
          );
        }
        break;

      case ACTION_TYPE.CHANGE_URL:
      case ACTION_TYPE.SCREENSHOT:
      case ACTION_TYPE.GET_VALUE:
        // actionPattern is not used for these actions (any value is OK)
        break;

      default:
        return ValidationResult.failure<void>(`Unknown actionType: ${actionType}`);
    }

    return ValidationResult.success<void>(undefined as void);
  }

  /**
   * Validate required fields based on action type
   * Ensures necessary fields are present for each action type
   *
   * @param xpath XPath step to validate
   * @returns ValidationResult indicating success or failure
   *
   * @example
   * ```typescript
   * const service = new StepValidationService();
   * const result = service.validateRequiredFields(xpath);
   * // Validates value field contains URL for CHANGE_URL action
   * ```
   */
  // eslint-disable-next-line complexity -- Required for comprehensive field validation per action type (11 types total). Each action type has different required field rules: TYPE requires non-empty value, SELECT_* requires value, JUDGE requires comparison target, CHANGE_URL requires valid URL, GET_VALUE requires variable name, while CLICK/CHECK/SCREENSHOT don't require value field
  validateRequiredFields(xpath: XPathData): ValidationResult<void> {
    const { actionType, value } = xpath;

    switch (actionType) {
      case ACTION_TYPE.TYPE:
        // TYPE requires non-empty value
        if (!value || value.trim() === '') {
          return ValidationResult.failure<void>('value is required for TYPE action');
        }
        break;

      case ACTION_TYPE.SELECT_VALUE:
      case ACTION_TYPE.SELECT_INDEX:
      case ACTION_TYPE.SELECT_TEXT:
      case ACTION_TYPE.SELECT_TEXT_EXACT:
        // SELECT_* requires non-empty value
        if (!value || value.trim() === '') {
          return ValidationResult.failure<void>(`value is required for ${actionType} action`);
        }
        break;

      case ACTION_TYPE.JUDGE:
        // JUDGE requires non-empty value (comparison target)
        if (!value || value.trim() === '') {
          return ValidationResult.failure<void>(
            'value (comparison target) is required for JUDGE action'
          );
        }
        break;

      case ACTION_TYPE.CHANGE_URL:
        // CHANGE_URL requires value to be a valid URL
        if (!value || value.trim() === '') {
          return ValidationResult.failure<void>('value (URL) is required for CHANGE_URL action');
        }
        // Basic URL validation
        if (!this.isValidUrl(value)) {
          return ValidationResult.failure<void>(
            `value must be a valid URL for CHANGE_URL action, got: ${value}`
          );
        }
        break;

      case ACTION_TYPE.GET_VALUE:
        // GET_VALUE requires non-empty value (variable name to store result)
        if (!value || value.trim() === '') {
          return ValidationResult.failure<void>(
            'value (variable name) is required for GET_VALUE action'
          );
        }
        break;

      case ACTION_TYPE.CLICK:
      case ACTION_TYPE.CHECK:
      case ACTION_TYPE.SCREENSHOT:
        // These actions don't require value field
        break;

      default:
        return ValidationResult.failure<void>(`Unknown actionType: ${actionType}`);
    }

    return ValidationResult.success<void>(undefined as void);
  }

  /**
   * Validate execution configuration
   * Ensures timeout and retry settings are valid
   *
   * @param xpath XPath step to validate
   * @returns ValidationResult indicating success or failure
   *
   * @example
   * ```typescript
   * const service = new StepValidationService();
   * const result = service.validateExecutionConfiguration(xpath);
   * // Validates executionTimeoutSeconds > 0 and afterWaitSeconds >= 0
   * ```
   */
  validateExecutionConfiguration(xpath: XPathData): ValidationResult<void> {
    const { executionTimeoutSeconds, afterWaitSeconds, retryType } = xpath;

    // Validate executionTimeoutSeconds is positive
    if (typeof executionTimeoutSeconds !== 'number' || executionTimeoutSeconds <= 0) {
      return ValidationResult.failure<void>(
        `executionTimeoutSeconds must be a positive number, got: ${executionTimeoutSeconds}`
      );
    }

    // Validate afterWaitSeconds is non-negative
    if (typeof afterWaitSeconds !== 'number' || afterWaitSeconds < 0) {
      return ValidationResult.failure<void>(
        `afterWaitSeconds must be a non-negative number, got: ${afterWaitSeconds}`
      );
    }

    // Validate retryType is valid
    const validRetryTypes = Object.values(RETRY_TYPE);
    if (!validRetryTypes.includes(retryType)) {
      return ValidationResult.failure<void>(`Invalid retryType: ${retryType}`);
    }

    return ValidationResult.success<void>(undefined as void);
  }

  /**
   * Basic URL validation helper
   * Checks if a string is a valid HTTP or HTTPS URL
   *
   * @param url URL string to validate
   * @returns true if valid URL, false otherwise
   */
  private isValidUrl(url: string): boolean {
    // Basic URL validation (http or https)
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
