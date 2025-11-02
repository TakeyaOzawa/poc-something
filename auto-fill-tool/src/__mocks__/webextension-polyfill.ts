/**
 * Mock for webextension-polyfill
 * Provides in-memory storage for testing
 */

// Shared storage map for all tests
export const mockStorage = new Map<string, unknown>();

const browser = {
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys: string | string[] | null) => {
        if (keys === null) {
          const allData: Record<string, unknown> = {};
          mockStorage.forEach((value, key) => {
            allData[key] = value;
          });
          return Promise.resolve(allData);
        }

        const result: Record<string, unknown> = {};
        const keyArray = typeof keys === 'string' ? [keys] : keys;

        keyArray.forEach((key) => {
          if (mockStorage.has(key)) {
            result[key] = mockStorage.get(key);
          }
        });

        return Promise.resolve(result);
      }),
      set: jest.fn().mockImplementation((data: Record<string, unknown>) => {
        Object.entries(data).forEach(([key, value]) => {
          mockStorage.set(key, value);
        });
        return Promise.resolve();
      }),
      remove: jest.fn().mockImplementation((keys: string | string[]) => {
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        keyArray.forEach((key) => mockStorage.delete(key));
        return Promise.resolve();
      }),
      clear: jest.fn().mockImplementation(() => {
        mockStorage.clear();
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path: string) => `chrome-extension://fake-id/${path}`),
    onInstalled: {
      addListener: jest.fn(),
    },
  },
  notifications: {
    create: jest.fn(),
    clear: jest.fn(),
    getAll: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
    clearAll: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    create: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    query: jest.fn(),
    remove: jest.fn(),
    sendMessage: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

export default browser;
