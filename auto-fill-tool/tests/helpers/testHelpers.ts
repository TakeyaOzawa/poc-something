/**
 * Test Helpers
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';

export function createTestXPathData(
  overrides?: Partial<Omit<XPathData, 'id'>>
): Omit<XPathData, 'id'> {
  return {
    websiteId: '',
    value: 'Test Value',
    actionType: ACTION_TYPE.TYPE,
    afterWaitSeconds: 0,
    actionPattern: 0,
    pathAbsolute: '/html/body/div[1]',
    pathShort: '//*[@id="test"]',
    pathSmart: '//div[@id="test"]',
    selectedPathPattern: 'smart',
    retryType: 0,
    executionOrder: 1,
    executionTimeoutSeconds: 30,
    url: 'https://example.com',
    ...overrides,
  };
}
