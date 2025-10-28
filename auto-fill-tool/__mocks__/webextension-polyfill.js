/**
 * Manual mock for webextension-polyfill
 * Jest will automatically use this for all tests
 */

// Initialize global storage if not already present
if (typeof global.mockBrowserStorage === 'undefined') {
  global.mockBrowserStorage = new Map();
}

const browserMock = {
  storage: {
    local: {
      get(keys) {
        if (keys === null) {
          const allData = {};
          global.mockBrowserStorage.forEach((value, key) => {
            allData[key] = value;
          });
          return Promise.resolve(allData);
        }
        const result = {};
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        keyArray.forEach((key) => {
          if (global.mockBrowserStorage.has(key)) {
            result[key] = global.mockBrowserStorage.get(key);
          }
        });
        return Promise.resolve(result);
      },
      set(data) {
        Object.entries(data).forEach(([key, value]) => {
          global.mockBrowserStorage.set(key, value);
        });
        return Promise.resolve();
      },
      remove(keys) {
        const keyArray = typeof keys === 'string' ? [keys] : keys;
        keyArray.forEach((key) => global.mockBrowserStorage.delete(key));
        return Promise.resolve();
      },
      clear() {
        global.mockBrowserStorage.clear();
        return Promise.resolve();
      },
    },
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
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
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
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
  i18n: {
    getMessage: jest.fn((key) => key),
    getUILanguage: jest.fn(() => 'en'),
  },
};

// Export as default (ES module style)
module.exports = {
  __esModule: true,
  default: browserMock,
};
