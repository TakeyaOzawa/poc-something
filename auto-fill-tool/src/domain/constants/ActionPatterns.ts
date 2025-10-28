/**
 * Action Pattern Constants
 *
 * Defines all action pattern constants used in Executors.
 *
 * Pattern Encoding:
 * - Structure: MMT (3 digits)
 *   - M (hundreds digit): Multiplicity flag (0 = single, 1 = multiple)
 *   - T (tens digit): Implementation type (1 = native, 2 = custom, 3 = jQuery)
 *   - Units digit: Reserved for future use
 */

/**
 * Select Action Patterns
 * Used in SelectActionExecutor for select element manipulation
 */
export const SELECT_PATTERN = Object.freeze({
  /**
   * Native HTML select element (single selection)
   * Standard DOM select element
   */
  NATIVE_SINGLE: 10,

  /**
   * Custom select component (single selection)
   * Framework-specific select implementation (e.g., React Select, Vue Select)
   */
  CUSTOM_SINGLE: 20,

  /**
   * jQuery select component (single selection)
   * jQuery-based select plugin (e.g., Select2, Chosen)
   */
  JQUERY_SINGLE: 30,

  /**
   * Native HTML select element (multiple selection)
   * Standard DOM select element with multiple attribute
   */
  NATIVE_MULTIPLE: 110,

  /**
   * Custom select component (multiple selection)
   * Framework-specific multi-select implementation
   */
  CUSTOM_MULTIPLE: 120,

  /**
   * jQuery select component (multiple selection)
   * jQuery-based multi-select plugin
   */
  JQUERY_MULTIPLE: 130,
});

/**
 * Input Action Patterns
 * Used in InputActionExecutor for input/textarea element manipulation
 *
 * Note: These constants are also defined in InputPattern enum.
 * This duplication ensures consistency across pattern decoding.
 */
export const INPUT_PATTERN = Object.freeze({
  /**
   * Basic input pattern
   * Standard DOM manipulation: focus(), value setting, input/change events
   */
  BASIC: 10,

  /**
   * Framework-agnostic input pattern
   * Handles React/Vue/Angular: native property setters, comprehensive events, jQuery support
   */
  FRAMEWORK_AGNOSTIC: 20,
});

/**
 * Checkbox Action Patterns
 * Used in CheckboxActionExecutor for checkbox/radio button manipulation
 */
export const CHECKBOX_PATTERN = Object.freeze({
  /**
   * Basic checkbox pattern
   * Standard DOM manipulation: checked property, change event
   */
  BASIC: 10,

  /**
   * Framework-agnostic checkbox pattern
   * Handles React/Vue/Angular: native property setters, comprehensive events
   */
  FRAMEWORK_AGNOSTIC: 20,
});

/**
 * Click Action Patterns
 * Used in ClickActionExecutor for click event simulation
 */
export const CLICK_PATTERN = Object.freeze({
  /**
   * Basic click pattern
   * Standard DOM click() method
   */
  BASIC: 10,

  /**
   * Framework-agnostic click pattern
   * Dispatches comprehensive click events for framework compatibility
   */
  FRAMEWORK_AGNOSTIC: 20,
});

/**
 * Pattern Decoding Helpers
 * These functions decode the pattern encoding to extract meaningful information
 */

/**
 * Check if pattern indicates multiple selection
 * Business Rule: Hundreds digit = 1 means multiple selection
 *
 * @param pattern - Action pattern number
 * @returns true if pattern is for multiple selection (100-199)
 *
 * @example
 * isMultipleSelectPattern(10)  // false (single)
 * isMultipleSelectPattern(110) // true (multiple)
 * isMultipleSelectPattern(120) // true (multiple)
 */
export function isMultipleSelectPattern(pattern: number): boolean {
  return Math.floor(pattern / 100) === 1;
}

/**
 * Extract implementation type from pattern
 * Business Rule: Tens digit indicates implementation type
 * - 1 = Native (standard HTML elements)
 * - 2 = Custom (framework components)
 * - 3 = jQuery (jQuery plugins)
 *
 * @param pattern - Action pattern number
 * @returns Implementation type (1, 2, or 3)
 *
 * @example
 * getImplementationType(10)  // 1 (native)
 * getImplementationType(20)  // 2 (custom)
 * getImplementationType(30)  // 3 (jQuery)
 * getImplementationType(120) // 2 (custom multiple)
 */
export function getImplementationType(pattern: number): number {
  return Math.floor((pattern % 100) / 10);
}

/**
 * Check if pattern is for native HTML elements
 *
 * @param pattern - Action pattern number
 * @returns true if pattern is for native elements (type 1)
 *
 * @example
 * isNativePattern(10)  // true
 * isNativePattern(20)  // false
 * isNativePattern(110) // true
 */
export function isNativePattern(pattern: number): boolean {
  return getImplementationType(pattern) === 1;
}

/**
 * Check if pattern is for custom framework components
 *
 * @param pattern - Action pattern number
 * @returns true if pattern is for custom components (type 2)
 *
 * @example
 * isCustomPattern(10)  // false
 * isCustomPattern(20)  // true
 * isCustomPattern(120) // true
 */
export function isCustomPattern(pattern: number): boolean {
  return getImplementationType(pattern) === 2;
}

/**
 * Check if pattern is for jQuery plugins
 *
 * @param pattern - Action pattern number
 * @returns true if pattern is for jQuery plugins (type 3)
 *
 * @example
 * isJQueryPattern(10)  // false
 * isJQueryPattern(30)  // true
 * isJQueryPattern(130) // true
 */
export function isJQueryPattern(pattern: number): boolean {
  return getImplementationType(pattern) === 3;
}

/**
 * Check if pattern requires waiting for options to load
 * Business Rule: Custom and jQuery select patterns need time for dynamic option loading
 *
 * @param pattern - Action pattern number
 * @returns true if pattern requires waiting (custom or jQuery)
 *
 * @example
 * requiresWaitForOptions(10)  // false (native)
 * requiresWaitForOptions(20)  // true (custom)
 * requiresWaitForOptions(30)  // true (jQuery)
 * requiresWaitForOptions(120) // true (custom multiple)
 */
export function requiresWaitForOptions(pattern: number): boolean {
  const implType = getImplementationType(pattern);
  return implType === 2 || implType === 3;
}

/**
 * Get pattern description for debugging/logging
 *
 * @param pattern - Action pattern number
 * @returns Human-readable pattern description
 *
 * @example
 * getPatternDescription(10)  // "Native Single Select"
 * getPatternDescription(20)  // "Custom Single Select"
 * getPatternDescription(120) // "Custom Multiple Select"
 */
export function getPatternDescription(pattern: number): string {
  const isMultiple = isMultipleSelectPattern(pattern);
  const implType = getImplementationType(pattern);

  const multiplicity = isMultiple ? 'Multiple' : 'Single';
  const implementation =
    implType === 1 ? 'Native' : implType === 2 ? 'Custom' : implType === 3 ? 'jQuery' : 'Unknown';

  return `${implementation} ${multiplicity} Select`;
}
