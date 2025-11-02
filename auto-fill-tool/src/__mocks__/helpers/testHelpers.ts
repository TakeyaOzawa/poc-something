import { XPathData } from '@domain/entities/XPathCollection';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { RETRY_TYPE } from '@domain/constants/RetryType';
import { PATH_PATTERN } from '@domain/constants/PathPattern';

export function createTestXPathData(overrides: Partial<XPathData> = {}): XPathData {
  return {
    id: 'test-id',
    websiteId: 'test-website',
    value: 'test-value',
    actionType: ACTION_TYPE.CLICK,
    afterWaitSeconds: 0,
    actionPattern: 20,
    pathAbsolute: '//div[@class="test"]',
    pathShort: '//div',
    pathSmart: 'div.test',
    selectedPathPattern: PATH_PATTERN.SMART,
    retryType: RETRY_TYPE.NO_RETRY,
    executionOrder: 1,
    executionTimeoutSeconds: 30,
    url: 'https://example.com',
    ...overrides
  };
}

export class MockLockoutManager {
  async isLocked(): Promise<boolean> {
    return false;
  }

  async lock(): Promise<void> {}

  async unlock(): Promise<boolean> {
    return true;
  }
}
