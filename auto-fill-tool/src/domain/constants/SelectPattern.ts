/**
 * Domain Constants: Select Pattern
 * Constants for select actionType dispatchEventPattern values
 */

/**
 * Select patterns for select action types
 * Used in dispatchEventPattern field when actionType is select_value/select_index/select_text/select_text_exact
 */
export const SELECT_PATTERN = {
  // Single selection
  NATIVE_SINGLE: 10, // ネイティブselect（単一選択）
  CUSTOM_SINGLE: 20, // カスタムコンポーネント（単一選択）
  JQUERY_SINGLE: 30, // Select2/jQuery（単一選択）

  // Multiple selection
  NATIVE_MULTIPLE: 110, // ネイティブselect（複数選択）
  CUSTOM_MULTIPLE: 120, // カスタムコンポーネント（複数選択）
  JQUERY_MULTIPLE: 130, // Select2/jQuery（複数選択）
} as const;

/**
 * Pattern解析用のフラグ定数
 */
export const SELECT_PATTERN_FLAGS = {
  MULTIPLE_FLAG: 100, // 100の位: 複数選択フラグ
  TYPE_MULTIPLIER: 10, // 10の位: カスタムタイプ
} as const;

/**
 * Type alias for select pattern values
 */
export type SelectPattern = (typeof SELECT_PATTERN)[keyof typeof SELECT_PATTERN];

/**
 * Type guard to check if a number is a valid select pattern
 */
export function isSelectPattern(value: number): value is SelectPattern {
  return Object.values(SELECT_PATTERN).includes(value as SelectPattern);
}

/**
 * Parse select pattern to extract multiple flag and custom type
 */
export function parseSelectPattern(pattern: number): {
  isMultiple: boolean;
  customType: 'native' | 'custom' | 'jquery';
} {
  // Default value (pattern=0 の場合)
  if (pattern === 0) {
    return { isMultiple: false, customType: 'native' };
  }

  // 100の位: 複数選択フラグ
  const isMultiple = Math.floor(pattern / SELECT_PATTERN_FLAGS.MULTIPLE_FLAG) === 1;

  // 10の位: カスタムタイプ
  const typeDigit = Math.floor((pattern % 100) / SELECT_PATTERN_FLAGS.TYPE_MULTIPLIER);

  let customType: 'native' | 'custom' | 'jquery' = 'native';
  switch (typeDigit) {
    case 1:
      customType = 'native';
      break;
    case 2:
      customType = 'custom';
      break;
    case 3:
      customType = 'jquery';
      break;
    default:
      customType = 'native'; // フォールバック
  }

  return { isMultiple, customType };
}
