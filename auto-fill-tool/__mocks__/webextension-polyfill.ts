/**
 * Mock for webextension-polyfill
 * Provides in-memory storage for testing
 */

// Shared storage map for all tests
export const mockStorage = new Map<string, any>();

const browser = {
  storage: {
    local: {
      get: jest.fn().mockImplementation((keys: string | string[] | null) => {
        if (keys === null) {
          const allData: Record<string, any> = {};
          mockStorage.forEach((value, key) => {
            allData[key] = value;
          });
          return Promise.resolve(allData);
        }

        const result: Record<string, any> = {};
        const keyArray = typeof keys === 'string' ? [keys] : keys;

        keyArray.forEach((key) => {
          if (mockStorage.has(key)) {
            result[key] = mockStorage.get(key);
          }
        });

        return Promise.resolve(result);
      }),
      set: jest.fn().mockImplementation((data: Record<string, any>) => {
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
  },
  alarms: {
    create: jest.fn(),
    clear: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
};

export default browser;
