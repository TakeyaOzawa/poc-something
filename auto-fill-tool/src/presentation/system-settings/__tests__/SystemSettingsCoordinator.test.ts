/**
 * Unit Tests: SystemSettingsCoordinator
 */

import { SystemSettingsCoordinator } from '../SystemSettingsCoordinator';
import { TabManager } from '@presentation/components/TabManager';
import type { SystemSettingsCoordinatorDependencies } from '../../types';

jest.mock('@presentation/components/TabManager');

describe('SystemSettingsCoordinator', () => {
  let mockTabManager: jest.Mocked<TabManager>;
  let mockDependencies: SystemSettingsCoordinatorDependencies;
  let originalHash: string;
  let hashChangeListeners: Array<(event: Event) => void>;
  let tabChangeListeners: Array<(event: CustomEvent) => void>;

  beforeEach(() => {
    // Save original hash
    originalHash = window.location.hash;

    // Mock dependencies
    mockDependencies = {
      presenter: {
        loadAllSettings: jest.fn(),
        getSettings: jest.fn(),
        exportSettings: jest.fn(),
      },
      view: {},
      logger: {
        createChild: jest.fn().mockReturnThis(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        setLevel: jest.fn(),
      },
      generalSettingsManager: {
        loadSettings: jest.fn(),
      },
      recordingSettingsManager: {
        loadSettings: jest.fn(),
      },
      appearanceSettingsManager: {
        loadSettings: jest.fn(),
      },
      permissionsSettingsManager: {
        initialize: jest.fn(),
        renderPermissionCards: jest.fn(),
      },
      dataSyncManager: {
        renderDataSyncCards: jest.fn(),
      },
      exportXPathsUseCase: {} as any,
      exportWebsitesUseCase: {} as any,
      exportAutomationVariablesUseCase: {} as any,
      exportStorageSyncConfigsUseCase: {} as any,
    };

    // Mock TabManager
    mockTabManager = {
      registerTab: jest.fn(),
      switchTo: jest.fn(),
      hasTab: jest.fn().mockReturnValue(true),
      getActiveTab: jest.fn().mockReturnValue('xpath-management'),
      getTabIds: jest.fn().mockReturnValue(['xpath-management', 'general-settings']),
      unregisterTab: jest.fn(),
    } as any;

    (TabManager as jest.MockedClass<typeof TabManager>).mockImplementation(() => mockTabManager);

    // Track event listeners
    hashChangeListeners = [];
    tabChangeListeners = [];

    const originalAddEventListener = window.addEventListener;
    jest.spyOn(window, 'addEventListener').mockImplementation((event: string, listener: any) => {
      if (event === 'hashchange') {
        hashChangeListeners.push(listener);
      } else {
        originalAddEventListener.call(window, event, listener);
      }
    });

    // Mock console.warn
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    // Restore original hash
    window.location.hash = originalHash;
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    hashChangeListeners = [];
    tabChangeListeners = [];
  });

  describe('constructor and initialization', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="tab-header">
          <button data-tab-id="general">General</button>
          <button data-tab-id="recording">Recording</button>
          <button data-tab-id="appearance">Appearance</button>
          <button data-tab-id="permissions">Permissions</button>
          <button data-tab-id="data-sync">Data Sync</button>
        </div>
        <div class="settings-container">
          <div id="general-tab">General Content</div>
          <div id="recording-tab">Recording Content</div>
          <div id="appearance-tab">Appearance Content</div>
          <div id="permissions-tab">Permissions Content</div>
          <div id="data-sync-tab">Data Sync Content</div>
        </div>
      `;
    });

    it('should initialize successfully with valid DOM elements', async () => {
      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(TabManager).toHaveBeenCalledWith(
        document.querySelector('.tab-header'),
        document.querySelector('.settings-container')
      );
      expect(mockTabManager.registerTab).toHaveBeenCalledTimes(5);
      expect(mockTabManager.registerTab).toHaveBeenCalledWith(
        'general',
        expect.any(HTMLElement),
        expect.any(HTMLElement)
      );
      expect(mockTabManager.registerTab).toHaveBeenCalledWith(
        'recording',
        expect.any(HTMLElement),
        expect.any(HTMLElement)
      );
      expect(mockTabManager.registerTab).toHaveBeenCalledWith(
        'appearance',
        expect.any(HTMLElement),
        expect.any(HTMLElement)
      );
      expect(mockTabManager.registerTab).toHaveBeenCalledWith(
        'permissions',
        expect.any(HTMLElement),
        expect.any(HTMLElement)
      );
      expect(mockTabManager.registerTab).toHaveBeenCalledWith(
        'data-sync',
        expect.any(HTMLElement),
        expect.any(HTMLElement)
      );
      expect(mockTabManager.switchTo).toHaveBeenCalledWith('general');
      expect(hashChangeListeners).toHaveLength(1);
    });

    it('should use hash from URL as default tab if present', async () => {
      window.location.hash = '#recording';

      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(mockTabManager.switchTo).toHaveBeenCalledWith('recording');
    });

    it('should use general as default tab when no hash', async () => {
      window.location.hash = '';

      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(mockTabManager.switchTo).toHaveBeenCalledWith('general');
    });

    it('should log error when tab-header not found', async () => {
      document.body.innerHTML = `<div class="settings-container"></div>`;

      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(mockDependencies.logger.error).toHaveBeenCalledWith(
        'Tab container elements not found'
      );
    });

    it('should log error when settings-container not found', async () => {
      document.body.innerHTML = `<div class="tab-header"></div>`;

      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(mockDependencies.logger.error).toHaveBeenCalledWith(
        'Tab container elements not found'
      );
    });

    it('should register hashchange event listener', async () => {
      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(hashChangeListeners).toHaveLength(1);
    });

    it('should register tabchange event listener on content container', async () => {
      const contentContainer = document.querySelector('.settings-container')!;
      const addEventListenerSpy = jest.spyOn(contentContainer, 'addEventListener');

      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith('tabchange', expect.any(Function));
    });

    it('should log warning when tab buttons not found', async () => {
      document.body.innerHTML = `
        <div class="tab-header"></div>
        <div class="settings-container">
          <div id="general-tab">General Content</div>
          <div id="recording-tab">Recording Content</div>
          <div id="appearance-tab">Appearance Content</div>
          <div id="permissions-tab">Permissions Content</div>
          <div id="data-sync-tab">Data Sync Content</div>
        </div>
      `;

      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      // Should still create TabManager but tabs won't be registered
      expect(TabManager).toHaveBeenCalled();
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: general'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: recording'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: appearance'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: permissions'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: data-sync'
      );
    });

    it('should log warning when content elements not found', async () => {
      document.body.innerHTML = `
        <div class="tab-header">
          <button data-tab-id="general">General</button>
          <button data-tab-id="recording">Recording</button>
          <button data-tab-id="appearance">Appearance</button>
          <button data-tab-id="permissions">Permissions</button>
          <button data-tab-id="data-sync">Data Sync</button>
        </div>
        <div class="settings-container"></div>
      `;

      const controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();

      expect(TabManager).toHaveBeenCalled();
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: general'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: recording'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: appearance'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: permissions'
      );
      expect(mockDependencies.logger.warn).toHaveBeenCalledWith(
        'Tab elements not found for tab ID: data-sync'
      );
    });
  });

  describe('hashchange event handling', () => {
    let controller: SystemSettingsCoordinator;

    beforeEach(async () => {
      document.body.innerHTML = `
        <div class="tab-header">
          <button data-tab-id="general">General</button>
          <button data-tab-id="recording">Recording</button>
          <button data-tab-id="appearance">Appearance</button>
          <button data-tab-id="permissions">Permissions</button>
          <button data-tab-id="data-sync">Data Sync</button>
        </div>
        <div class="settings-container">
          <div id="general-tab">General Content</div>
          <div id="recording-tab">Recording Content</div>
          <div id="appearance-tab">Appearance Content</div>
          <div id="permissions-tab">Permissions Content</div>
          <div id="data-sync-tab">Data Sync Content</div>
        </div>
      `;
      controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();
      jest.clearAllMocks();
    });

    it('should switch tab when hash changes to valid tab', () => {
      window.location.hash = '#recording';
      hashChangeListeners[0](new Event('hashchange'));

      expect(mockTabManager.switchTo).toHaveBeenCalledWith('recording');
    });

    it('should not switch tab when hash changes to invalid tab', () => {
      mockTabManager.hasTab.mockReturnValue(false);
      window.location.hash = '#invalid-tab';
      hashChangeListeners[0](new Event('hashchange'));

      expect(mockTabManager.switchTo).not.toHaveBeenCalled();
    });

    it('should not switch tab when hash is empty', () => {
      window.location.hash = '';
      hashChangeListeners[0](new Event('hashchange'));

      expect(mockTabManager.switchTo).not.toHaveBeenCalled();
    });
  });

  describe('tabchange event handling', () => {
    let controller: SystemSettingsCoordinator;
    let contentContainer: HTMLElement;

    beforeEach(async () => {
      document.body.innerHTML = `
        <div class="tab-header">
          <button data-tab-id="general">General</button>
          <button data-tab-id="recording">Recording</button>
          <button data-tab-id="appearance">Appearance</button>
          <button data-tab-id="permissions">Permissions</button>
          <button data-tab-id="data-sync">Data Sync</button>
        </div>
        <div class="settings-container">
          <div id="general-tab">General Content</div>
          <div id="recording-tab">Recording Content</div>
          <div id="appearance-tab">Appearance Content</div>
          <div id="permissions-tab">Permissions Content</div>
          <div id="data-sync-tab">Data Sync Content</div>
        </div>
      `;
      contentContainer = document.querySelector('.settings-container')!;
      controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();
      window.location.hash = '';
    });

    it('should update URL hash when tab changes', () => {
      const event = new CustomEvent('tabchange', { detail: { tabId: 'recording' } });
      contentContainer.dispatchEvent(event);

      expect(window.location.hash).toBe('#recording');
    });

    it('should not update URL hash if already matches', () => {
      window.location.hash = '#general';
      const originalHash = window.location.hash;

      const event = new CustomEvent('tabchange', { detail: { tabId: 'general' } });
      contentContainer.dispatchEvent(event);

      expect(window.location.hash).toBe(originalHash);
    });
  });

  describe('getActiveTab', () => {
    let controller: SystemSettingsCoordinator;

    beforeEach(async () => {
      document.body.innerHTML = `
        <div class="tab-header">
          <button data-tab-id="general">General</button>
          <button data-tab-id="recording">Recording</button>
          <button data-tab-id="appearance">Appearance</button>
          <button data-tab-id="permissions">Permissions</button>
          <button data-tab-id="data-sync">Data Sync</button>
        </div>
        <div class="settings-container">
          <div id="general-tab">General Content</div>
          <div id="recording-tab">Recording Content</div>
          <div id="appearance-tab">Appearance Content</div>
          <div id="permissions-tab">Permissions Content</div>
          <div id="data-sync-tab">Data Sync Content</div>
        </div>
      `;
      controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();
    });

    it('should return active tab from TabManager', () => {
      mockTabManager.getActiveTab.mockReturnValue('recording');

      const result = controller.getActiveTab();

      expect(result).toBe('recording');
      expect(mockTabManager.getActiveTab).toHaveBeenCalled();
    });

    it('should return null when no active tab', () => {
      mockTabManager.getActiveTab.mockReturnValue(null);

      const result = controller.getActiveTab();

      expect(result).toBeNull();
    });
  });

  describe('switchToTab', () => {
    let controller: SystemSettingsCoordinator;

    beforeEach(async () => {
      document.body.innerHTML = `
        <div class="tab-header">
          <button data-tab-id="general">General</button>
          <button data-tab-id="recording">Recording</button>
          <button data-tab-id="appearance">Appearance</button>
          <button data-tab-id="permissions">Permissions</button>
          <button data-tab-id="data-sync">Data Sync</button>
        </div>
        <div class="settings-container">
          <div id="general-tab">General Content</div>
          <div id="recording-tab">Recording Content</div>
          <div id="appearance-tab">Appearance Content</div>
          <div id="permissions-tab">Permissions Content</div>
          <div id="data-sync-tab">Data Sync Content</div>
        </div>
      `;
      controller = new SystemSettingsCoordinator(mockDependencies);
      await controller.initialize();
      jest.clearAllMocks();
    });

    it('should call TabManager switchTo method', () => {
      controller.switchToTab('recording');

      expect(mockTabManager.switchTo).toHaveBeenCalledWith('recording');
    });

    it('should handle switching to general tab', () => {
      controller.switchToTab('general');

      expect(mockTabManager.switchTo).toHaveBeenCalledWith('general');
    });
  });
});
