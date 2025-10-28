/**
 * Test Fixtures: Test Data Factories
 * Provides factory functions to create test data with sensible defaults.
 * Reduces boilerplate and ensures consistency across test files.
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { WebsiteData } from '@domain/entities/Website';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { PATH_PATTERN } from '@domain/constants/PathPattern';
import { RETRY_TYPE } from '@domain/constants/RetryType';
import { EVENT_PATTERN } from '@domain/constants/EventPattern';

/**
 * Creates a test XPathData object with sensible defaults.
 * Override any field by passing it in the overrides parameter.
 *
 * @example
 * ```typescript
 * const xpath = createTestXPath({ id: 'custom-id', value: 'custom-value' });
 * ```
 */
export function createTestXPath(overrides: Partial<XPathData> = {}): XPathData {
  return {
    id: `xpath-${Date.now()}-${Math.random()}`,
    websiteId: 'test-website',
    value: 'test-value',
    actionType: ACTION_TYPE.TYPE,
    afterWaitSeconds: 0,
    actionPattern: EVENT_PATTERN.BASIC,
    pathAbsolute: '/html/body/div[1]/input',
    pathShort: '//input[@id="test"]',
    pathSmart: 'input#test',
    selectedPathPattern: PATH_PATTERN.SMART,
    retryType: RETRY_TYPE.NO_RETRY,
    executionOrder: 100,
    executionTimeoutSeconds: 30,
    url: 'https://example.com',
    ...overrides,
  };
}

/**
 * Creates multiple test XPathData objects with sequential execution orders.
 *
 * @example
 * ```typescript
 * const xpaths = createTestXPaths(3, { websiteId: 'my-website' });
 * // Returns 3 XPaths with execution orders 100, 200, 300
 * ```
 */
export function createTestXPaths(
  count: number,
  baseOverrides: Partial<XPathData> = {}
): XPathData[] {
  return Array.from({ length: count }, (_, index) =>
    createTestXPath({
      ...baseOverrides,
      executionOrder: (index + 1) * 100,
      id: `xpath-${index + 1}`,
    })
  );
}

/**
 * Creates a test WebsiteData object with sensible defaults.
 *
 * @example
 * ```typescript
 * const website = createTestWebsite({ name: 'Custom Name' });
 * ```
 */
export function createTestWebsite(overrides: Partial<WebsiteData> = {}): WebsiteData {
  return {
    id: `website-${Date.now()}-${Math.random()}`,
    name: 'Test Website',
    startUrl: 'https://example.com',
    editable: true,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple test WebsiteData objects.
 *
 * @example
 * ```typescript
 * const websites = createTestWebsites(3);
 * ```
 */
export function createTestWebsites(
  count: number,
  baseOverrides: Partial<WebsiteData> = {}
): WebsiteData[] {
  return Array.from({ length: count }, (_, index) =>
    createTestWebsite({
      ...baseOverrides,
      id: `website-${index + 1}`,
      name: `Test Website ${index + 1}`,
    })
  );
}

/**
 * Creates test automation variables.
 *
 * @example
 * ```typescript
 * const variables = createTestVariables({ username: 'testuser' });
 * ```
 */
export function createTestVariables(
  variables: Record<string, string> = {}
): Record<string, string> {
  return {
    username: 'testuser',
    password: 'testpass',
    ...variables,
  };
}

/**
 * Preset XPath configurations for common test scenarios.
 */
export const XPathPresets = {
  /**
   * TYPE action for username input
   */
  usernameInput: (overrides: Partial<XPathData> = {}) =>
    createTestXPath({
      id: 'username-input',
      value: '{{username}}',
      actionType: ACTION_TYPE.TYPE,
      pathSmart: '//input[@id="username"]',
      executionOrder: 100,
      ...overrides,
    }),

  /**
   * TYPE action for password input
   */
  passwordInput: (overrides: Partial<XPathData> = {}) =>
    createTestXPath({
      id: 'password-input',
      value: '{{password}}',
      actionType: ACTION_TYPE.TYPE,
      pathSmart: '//input[@type="password"]',
      executionOrder: 200,
      ...overrides,
    }),

  /**
   * CLICK action for submit button
   */
  submitButton: (overrides: Partial<XPathData> = {}) =>
    createTestXPath({
      id: 'submit-button',
      value: '',
      actionType: ACTION_TYPE.CLICK,
      pathSmart: '//button[@type="submit"]',
      executionOrder: 300,
      ...overrides,
    }),

  /**
   * CHECK action for checkbox
   */
  checkbox: (overrides: Partial<XPathData> = {}) =>
    createTestXPath({
      id: 'checkbox',
      value: 'true',
      actionType: ACTION_TYPE.CHECK,
      pathSmart: '//input[@type="checkbox"]',
      ...overrides,
    }),

  /**
   * JUDGE action for validation
   */
  judge: (overrides: Partial<XPathData> = {}) =>
    createTestXPath({
      id: 'judge-result',
      value: 'Success',
      actionType: ACTION_TYPE.JUDGE,
      pathSmart: '//div[@id="result"]',
      ...overrides,
    }),

  /**
   * SELECT action for dropdown (by value)
   */
  select: (overrides: Partial<XPathData> = {}) =>
    createTestXPath({
      id: 'select-dropdown',
      value: 'option-value',
      actionType: ACTION_TYPE.SELECT_VALUE,
      pathSmart: '//select[@id="dropdown"]',
      ...overrides,
    }),

  /**
   * CHANGE_URL action
   */
  changeUrl: (overrides: Partial<XPathData> = {}) =>
    createTestXPath({
      id: 'change-url',
      value: 'https://example.com/next-page',
      actionType: ACTION_TYPE.CHANGE_URL,
      pathSmart: '',
      ...overrides,
    }),

  /**
   * Standard login flow (username + password + submit)
   */
  loginFlow: (websiteId: string = 'test-website') => [
    XPathPresets.usernameInput({ websiteId, executionOrder: 100 }),
    XPathPresets.passwordInput({ websiteId, executionOrder: 200 }),
    XPathPresets.submitButton({ websiteId, executionOrder: 300 }),
  ],
};

/**
 * Preset Website configurations for common test scenarios.
 */
export const WebsitePresets = {
  /**
   * Editable test website
   */
  editable: (overrides: Partial<WebsiteData> = {}) =>
    createTestWebsite({
      editable: true,
      ...overrides,
    }),

  /**
   * Non-editable (system) website
   */
  nonEditable: (overrides: Partial<WebsiteData> = {}) =>
    createTestWebsite({
      editable: false,
      ...overrides,
    }),
};
