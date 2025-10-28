/**
 * Unit Tests: TabManager
 */

import { TabManager } from '../TabManager';

describe('TabManager', () => {
  let tabContainer: HTMLElement;
  let contentContainer: HTMLElement;
  let tabManager: TabManager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="tab-container"></div>
      <div id="content-container"></div>
    `;

    tabContainer = document.getElementById('tab-container')!;
    contentContainer = document.getElementById('content-container')!;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should create instance with valid containers', () => {
      expect(() => {
        tabManager = new TabManager(tabContainer, contentContainer);
      }).not.toThrow();
    });

    it('should throw error if tab container is missing', () => {
      expect(() => {
        new TabManager(null as any, contentContainer);
      }).toThrow('Tab container element is required');
    });

    it('should throw error if content container is missing', () => {
      expect(() => {
        new TabManager(tabContainer, null as any);
      }).toThrow('Content container element is required');
    });
  });

  describe('registerTab', () => {
    beforeEach(() => {
      tabManager = new TabManager(tabContainer, contentContainer);
    });

    it('should register a new tab successfully', () => {
      const tabButton = document.createElement('button');
      const contentElement = document.createElement('div');

      tabManager.registerTab('tab1', tabButton, contentElement);

      expect(tabManager.hasTab('tab1')).toBe(true);
      expect(tabManager.getTabIds()).toContain('tab1');
    });

    it('should throw error if tab ID is empty', () => {
      const tabButton = document.createElement('button');
      const contentElement = document.createElement('div');

      expect(() => {
        tabManager.registerTab('', tabButton, contentElement);
      }).toThrow('Tab ID is required');
    });

    it('should throw error if tab button is missing', () => {
      const contentElement = document.createElement('div');

      expect(() => {
        tabManager.registerTab('tab1', null as any, contentElement);
      }).toThrow('Tab button element is required');
    });

    it('should throw error if content element is missing', () => {
      const tabButton = document.createElement('button');

      expect(() => {
        tabManager.registerTab('tab1', tabButton, null as any);
      }).toThrow('Content element is required');
    });

    it('should throw error if tab ID is already registered', () => {
      const tabButton = document.createElement('button');
      const contentElement = document.createElement('div');

      tabManager.registerTab('tab1', tabButton, contentElement);

      expect(() => {
        tabManager.registerTab(
          'tab1',
          document.createElement('button'),
          document.createElement('div')
        );
      }).toThrow('Tab with ID "tab1" is already registered');
    });

    it('should add click listener to tab button', () => {
      const tabButton = document.createElement('button');
      const contentElement = document.createElement('div');
      const clickSpy = jest.fn();

      tabManager.registerTab('tab1', tabButton, contentElement);
      tabButton.addEventListener('click', clickSpy);

      tabButton.click();

      // Should trigger both listeners
      expect(tabManager.getActiveTab()).toBe('tab1');
    });
  });

  describe('switchTo', () => {
    let tab1Button: HTMLButtonElement;
    let tab1Content: HTMLDivElement;
    let tab2Button: HTMLButtonElement;
    let tab2Content: HTMLDivElement;

    beforeEach(() => {
      tabManager = new TabManager(tabContainer, contentContainer);

      tab1Button = document.createElement('button');
      tab1Content = document.createElement('div');
      tab2Button = document.createElement('button');
      tab2Content = document.createElement('div');

      tabManager.registerTab('tab1', tab1Button, tab1Content);
      tabManager.registerTab('tab2', tab2Button, tab2Content);
    });

    it('should switch to the specified tab', () => {
      tabManager.switchTo('tab1');

      expect(tab1Content.style.display).toBe('block');
      expect(tab1Content.classList.contains('active')).toBe(true);
      expect(tab2Content.style.display).toBe('none');
      expect(tab2Content.classList.contains('active')).toBe(false);
    });

    it('should update active tab state', () => {
      tabManager.switchTo('tab1');
      expect(tabManager.getActiveTab()).toBe('tab1');

      tabManager.switchTo('tab2');
      expect(tabManager.getActiveTab()).toBe('tab2');
    });

    it('should update tab button styles', () => {
      tabManager.switchTo('tab1');

      expect(tab1Button.classList.contains('active')).toBe(true);
      expect(tab1Button.getAttribute('aria-selected')).toBe('true');
      expect(tab2Button.classList.contains('active')).toBe(false);
      expect(tab2Button.getAttribute('aria-selected')).toBe('false');
    });

    it('should dispatch tabchange event', () => {
      const eventListener = jest.fn();
      contentContainer.addEventListener('tabchange', eventListener);

      tabManager.switchTo('tab1');

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            tabId: 'tab1',
          }),
        })
      );
    });

    it('should handle switching to non-existent tab gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      tabManager.switchTo('non-existent');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Tab "non-existent" not found, ignoring switch request'
      );
      expect(tabManager.getActiveTab()).toBeNull();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getActiveTab', () => {
    beforeEach(() => {
      tabManager = new TabManager(tabContainer, contentContainer);

      const tab1Button = document.createElement('button');
      const tab1Content = document.createElement('div');
      tabManager.registerTab('tab1', tab1Button, tab1Content);
    });

    it('should return null initially', () => {
      expect(tabManager.getActiveTab()).toBeNull();
    });

    it('should return active tab ID after switching', () => {
      tabManager.switchTo('tab1');
      expect(tabManager.getActiveTab()).toBe('tab1');
    });
  });

  describe('getTabIds', () => {
    beforeEach(() => {
      tabManager = new TabManager(tabContainer, contentContainer);
    });

    it('should return empty array when no tabs registered', () => {
      expect(tabManager.getTabIds()).toEqual([]);
    });

    it('should return all registered tab IDs', () => {
      const tab1Button = document.createElement('button');
      const tab1Content = document.createElement('div');
      const tab2Button = document.createElement('button');
      const tab2Content = document.createElement('div');

      tabManager.registerTab('tab1', tab1Button, tab1Content);
      tabManager.registerTab('tab2', tab2Button, tab2Content);

      const tabIds = tabManager.getTabIds();
      expect(tabIds).toHaveLength(2);
      expect(tabIds).toContain('tab1');
      expect(tabIds).toContain('tab2');
    });
  });

  describe('hasTab', () => {
    beforeEach(() => {
      tabManager = new TabManager(tabContainer, contentContainer);

      const tab1Button = document.createElement('button');
      const tab1Content = document.createElement('div');
      tabManager.registerTab('tab1', tab1Button, tab1Content);
    });

    it('should return true for registered tab', () => {
      expect(tabManager.hasTab('tab1')).toBe(true);
    });

    it('should return false for non-registered tab', () => {
      expect(tabManager.hasTab('tab2')).toBe(false);
    });
  });

  describe('unregisterTab', () => {
    let tab1Button: HTMLButtonElement;
    let tab1Content: HTMLDivElement;

    beforeEach(() => {
      tabManager = new TabManager(tabContainer, contentContainer);

      tab1Button = document.createElement('button');
      tab1Content = document.createElement('div');
      tabManager.registerTab('tab1', tab1Button, tab1Content);
    });

    it('should unregister a tab successfully', () => {
      tabManager.unregisterTab('tab1');

      expect(tabManager.hasTab('tab1')).toBe(false);
      expect(tabManager.getTabIds()).not.toContain('tab1');
    });

    it('should hide content element when unregistering', () => {
      tab1Content.style.display = 'block';
      tab1Content.classList.add('active');

      tabManager.unregisterTab('tab1');

      expect(tab1Content.style.display).toBe('none');
      expect(tab1Content.classList.contains('active')).toBe(false);
    });

    it('should clear active tab if unregistering active tab', () => {
      tabManager.switchTo('tab1');
      expect(tabManager.getActiveTab()).toBe('tab1');

      tabManager.unregisterTab('tab1');

      expect(tabManager.getActiveTab()).toBeNull();
    });

    it('should handle unregistering non-existent tab gracefully', () => {
      expect(() => {
        tabManager.unregisterTab('non-existent');
      }).not.toThrow();
    });
  });

  describe('tab button click', () => {
    let tab1Button: HTMLButtonElement;
    let tab1Content: HTMLDivElement;
    let tab2Button: HTMLButtonElement;
    let tab2Content: HTMLDivElement;

    beforeEach(() => {
      tabManager = new TabManager(tabContainer, contentContainer);

      tab1Button = document.createElement('button');
      tab1Content = document.createElement('div');
      tab2Button = document.createElement('button');
      tab2Content = document.createElement('div');

      tabManager.registerTab('tab1', tab1Button, tab1Content);
      tabManager.registerTab('tab2', tab2Button, tab2Content);
    });

    it('should switch tabs when button is clicked', () => {
      tab1Button.click();

      expect(tabManager.getActiveTab()).toBe('tab1');
      expect(tab1Content.style.display).toBe('block');

      tab2Button.click();

      expect(tabManager.getActiveTab()).toBe('tab2');
      expect(tab2Content.style.display).toBe('block');
      expect(tab1Content.style.display).toBe('none');
    });
  });
});
