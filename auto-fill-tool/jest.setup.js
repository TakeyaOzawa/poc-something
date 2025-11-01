/**
 * Jest Setup File
 * webextension-polyfill is mocked automatically by __mocks__/webextension-polyfill.js
 */

// Shared storage Map for all tests - can be accessed and cleared by test files
global.mockBrowserStorage = new Map();

// Mock window.alert for all tests (jsdom doesn't implement it)
global.alert = jest.fn();

// Add TextEncoder/TextDecoder polyfill for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Add Web Crypto API polyfill for Node.js environment
const nodeCrypto = require('crypto');
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => nodeCrypto.randomFillSync(arr),
    subtle: nodeCrypto.webcrypto.subtle,
  },
  writable: true,
  configurable: true,
});

// Mock DOM environment for ActionExecutor tests
global.window = global.window || {};
global.window.innerHeight = 768;
global.window.innerWidth = 1024;

// Mock Event constructor
global.Event = class Event {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = options.bubbles || false;
    this.cancelable = options.cancelable || false;
  }
};

// Mock MouseEvent constructor
global.MouseEvent = class MouseEvent extends global.Event {
  constructor(type, options = {}) {
    super(type, options);
    this.view = options.view || null;
  }
};

// Mock HTML element constructors with proper prototypes
global.HTMLElement = class HTMLElement {
  constructor() {
    this.tagName = '';
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.click = jest.fn();
    this.focus = jest.fn();
    this.dispatchEvent = jest.fn();
    this.appendChild = jest.fn();
    this.scrollIntoView = jest.fn();
    this.getBoundingClientRect = jest.fn(() => ({
      width: 100,
      height: 50,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100
    }));
  }
};

global.HTMLInputElement = class HTMLInputElement extends global.HTMLElement {
  constructor() {
    super();
    this.type = 'text';
    this.checked = false;
  }
};

global.HTMLTextAreaElement = class HTMLTextAreaElement extends global.HTMLElement {
  constructor() {
    super();
  }
};

global.HTMLSelectElement = class HTMLSelectElement extends global.HTMLElement {
  constructor() {
    super();
    this.selectedIndex = -1;
    this.options = [];
    
    // valueプロパティを設定
    Object.defineProperty(this, 'value', {
      get: function() {
        return this.selectedIndex >= 0 && this.options[this.selectedIndex] ? this.options[this.selectedIndex].value : '';
      },
      set: function(val) {
        const option = this.options.find(opt => opt.value === val);
        if (option) {
          this.selectedIndex = option.index;
        }
      },
      configurable: true
    });
  }
};

// Mock URL constructor
global.URL = class URL {
  constructor(url, base) {
    if (url === 'invalid-url' && !base) {
      throw new Error('Invalid URL');
    }
    this.href = url;
    this.origin = base || 'https://example.com';
  }
};

// Mock Chrome API
const chrome = {
  storage: {
    local: {
      get: jest.fn((keys) => {
        return new Promise((resolve) => {
          if (typeof keys === 'string') {
            const value = global.mockBrowserStorage.get(keys);
            resolve({ [keys]: value });
          } else if (Array.isArray(keys)) {
            const result = {};
            keys.forEach(key => {
              result[key] = global.mockBrowserStorage.get(key);
            });
            resolve(result);
          } else {
            resolve({});
          }
        });
      }),
      set: jest.fn((items) => {
        return new Promise((resolve) => {
          Object.keys(items).forEach(key => {
            global.mockBrowserStorage.set(key, items[key]);
          });
          resolve();
        });
      }),
      remove: jest.fn((keys) => {
        return new Promise((resolve) => {
          if (typeof keys === 'string') {
            global.mockBrowserStorage.delete(keys);
          } else if (Array.isArray(keys)) {
            keys.forEach(key => global.mockBrowserStorage.delete(key));
          }
          resolve();
        });
      })
    }
  }
};

global.chrome = chrome;

// Create a more complete document mock
const mockBody = {
  appendChild: jest.fn(),
  innerHTML: '',
  children: [],
};

global.document = global.document || {
  evaluate: jest.fn(),
  createElement: jest.fn((tagName) => {
    const element = {
      tagName: tagName.toUpperCase(),
      click: jest.fn(),
      focus: jest.fn(),
      value: '',
      checked: false,
      selectedIndex: 0,
      options: [],
      type: '',
      innerHTML: '',
      textContent: '',
      dispatchEvent: jest.fn(),
      appendChild: jest.fn(),
      scrollIntoView: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        bottom: 50,
        right: 100
      })),
    };
    
    // Add specific properties and prototype for input elements
    if (tagName === 'input') {
      element.type = 'text';
      // Make it instanceof HTMLInputElement
      Object.setPrototypeOf(element, HTMLInputElement.prototype);
    } else if (tagName === 'textarea') {
      // Make it instanceof HTMLTextAreaElement
      Object.setPrototypeOf(element, HTMLTextAreaElement.prototype);
    } else if (tagName === 'select') {
      // Make it instanceof HTMLSelectElement
      Object.setPrototypeOf(element, HTMLSelectElement.prototype);
      // Add select-specific properties
      const option1 = { value: 'option1', text: 'Option 1', index: 0 };
      const option2 = { value: 'option2', text: 'Option 2', index: 1 };
      element.options = [option1, option2];
      element.selectedIndex = -1;
      
      // Override value setter to work with selectedIndex
      Object.defineProperty(element, 'value', {
        get: function() {
          return this.selectedIndex >= 0 ? this.options[this.selectedIndex].value : '';
        },
        set: function(val) {
          const option = this.options.find(opt => opt.value === val);
          if (option) {
            this.selectedIndex = option.index;
          }
        }
      });
    } else {
      // Make all other elements instanceof HTMLElement
      Object.setPrototypeOf(element, HTMLElement.prototype);
    }
    
    return element;
  }),
  body: mockBody,
};

// Mock XPathResult for ActionExecutor tests
Object.defineProperty(global.window, 'XPathResult', {
  value: {
    FIRST_ORDERED_NODE_TYPE: 9
  },
  writable: true,
  configurable: true,
});

// Mock uuid module with incrementing IDs
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    uuidCounter++;
    return `test-uuid-${uuidCounter.toString().padStart(4, '0')}-5678-90ab-cdef12345678`;
  }),
}));
