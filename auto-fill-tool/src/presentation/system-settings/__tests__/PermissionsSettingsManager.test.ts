/**
 * Unit Tests: PermissionsSettingsManager
 * Tests for permissions settings UI management
 */

import { PermissionsSettingsManager } from '../PermissionsSettingsManager';
import { PermissionManager } from '@infrastructure/adapters/PermissionManager';
import type {
  OptionalPermission,
  PermissionStatus,
  PermissionRequestResult,
} from '@infrastructure/adapters/PermissionManager';
import { Logger } from '@domain/types/logger.types';

// Mock ChromeStorageLogAggregatorPort
jest.mock('@/infrastructure/adapters/ChromeStorageLogAggregatorAdapter', () => ({
  ChromeStorageLogAggregatorPort: jest.fn().mockImplementation(() => ({
    addLog: jest.fn(),
    getLogs: jest.fn(),
    getLogCount: jest.fn(),
    deleteOldLogs: jest.fn(),
    clearAllLogs: jest.fn(),
    deleteLog: jest.fn(),
    applyRotation: jest.fn(),
  })),
}));

jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: (key: string) => key,
    applyToDOM: jest.fn(),
  },
}));

// Mock PermissionManager instance methods
const mockPermissionManagerInstance = {
  hasPermission: jest.fn(),
  requestPermission: jest.fn(),
  removePermission: jest.fn(),
  getAllPermissions: jest.fn(),
  requestPermissions: jest.fn(),
};

jest.mock('@infrastructure/adapters/PermissionManager', () => ({
  PermissionManager: jest.fn().mockImplementation(() => mockPermissionManagerInstance),
}));

describe('PermissionsSettingsManager', () => {
  let manager: PermissionsSettingsManager;
  let mockLogger: jest.Mocked<Logger>;
  let container: HTMLElement;
  let statusMessageDiv: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="permissions-tab">
        <div class="permissions-list"></div>
      </div>
      <div id="statusMessage" style="display: none;"></div>
    `;

    container = document.getElementById('permissions-tab')!;
    statusMessageDiv = document.getElementById('statusMessage')!;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
      setLevel: jest.fn(),
    } as any;

    // Clear all mocks
    jest.clearAllMocks();

    manager = new PermissionsSettingsManager(mockLogger);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize with container element', () => {
      expect(manager).toBeDefined();
    });

    it('should log error when permissions-tab element not found', () => {
      document.body.innerHTML = '';
      const newManager = new PermissionsSettingsManager(mockLogger);

      expect(mockLogger.error).toHaveBeenCalledWith('Permissions settings tab element not found');
      expect(newManager).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should call renderPermissionCards on initialization', async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'tabs',
          granted: true,
          description: 'Access tab information',
          requiredFor: ['Recording'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      await manager.initialize();

      expect(mockPermissionManagerInstance.getAllPermissions).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Permission cards rendered', { count: 1 });
    });
  });

  describe('renderPermissionCards', () => {
    it('should render all permission cards', async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'tabs',
          granted: true,
          description: 'Access tab information',
          requiredFor: ['Recording'],
        },
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      await manager.renderPermissionCards();

      const cards = container.querySelectorAll('.permission-card');
      expect(cards).toHaveLength(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Permission cards rendered', { count: 2 });
    });

    it('should render granted permission with remove button', async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'tabs',
          granted: true,
          description: 'Access tab information',
          requiredFor: ['Recording'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      await manager.renderPermissionCards();

      const card = container.querySelector('.permission-card');
      expect(card).toBeTruthy();
      expect(card?.querySelector('.status-granted')).toBeTruthy();
      expect(card?.querySelector('.btn-remove-permission')).toBeTruthy();
      expect(card?.querySelector('.btn-request-permission')).toBeFalsy();
    });

    it('should render not-granted permission with request button', async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      await manager.renderPermissionCards();

      const card = container.querySelector('.permission-card');
      expect(card).toBeTruthy();
      expect(card?.querySelector('.status-not-granted')).toBeTruthy();
      expect(card?.querySelector('.btn-request-permission')).toBeTruthy();
      expect(card?.querySelector('.btn-remove-permission')).toBeFalsy();
    });

    it('should render permission details correctly', async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'tabs',
          granted: true,
          description: 'Access tab information',
          requiredFor: ['Recording', 'Tab monitoring'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      await manager.renderPermissionCards();

      const card = container.querySelector('.permission-card');
      expect(card?.textContent).toContain('Tabs Access');
      expect(card?.textContent).toContain('Access tab information');
      expect(card?.textContent).toContain('Recording');
      expect(card?.textContent).toContain('Tab monitoring');
    });

    it('should handle errors during rendering', async () => {
      mockPermissionManagerInstance.getAllPermissions.mockRejectedValue(new Error('API error'));

      await manager.renderPermissionCards();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to render permission cards',
        expect.any(Error)
      );
    });

    it('should clear existing cards before rendering new ones', async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'tabs',
          granted: true,
          description: 'Access tab information',
          requiredFor: ['Recording'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      // First render
      await manager.renderPermissionCards();
      expect(container.querySelectorAll('.permission-card')).toHaveLength(1);

      // Second render with different data
      const newMockPermissions: PermissionStatus[] = [
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
        {
          permission: 'contextMenus',
          granted: true,
          description: 'Context menu',
          requiredFor: ['Menu'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(newMockPermissions);
      await manager.renderPermissionCards();

      const cards = container.querySelectorAll('.permission-card');
      expect(cards).toHaveLength(2);
    });

    it('should render all 5 optional permission types', async () => {
      const mockPermissions: PermissionStatus[] = [
        { permission: 'tabs', granted: true, description: 'Tabs', requiredFor: ['Recording'] },
        {
          permission: 'tabCapture',
          granted: false,
          description: 'Tab Capture',
          requiredFor: ['Recording'],
        },
        {
          permission: 'offscreen',
          granted: true,
          description: 'Offscreen',
          requiredFor: ['Recording'],
        },
        {
          permission: 'notifications',
          granted: false,
          description: 'Notifications',
          requiredFor: ['Alerts'],
        },
        {
          permission: 'contextMenus',
          granted: true,
          description: 'Context Menus',
          requiredFor: ['Menu'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      await manager.renderPermissionCards();

      const cards = container.querySelectorAll('.permission-card');
      expect(cards).toHaveLength(5);

      // Verify each permission type is rendered
      const permissionTypes = Array.from(cards).map((card) => card.getAttribute('data-permission'));
      expect(permissionTypes).toContain('tabs');
      expect(permissionTypes).toContain('tabCapture');
      expect(permissionTypes).toContain('offscreen');
      expect(permissionTypes).toContain('notifications');
      expect(permissionTypes).toContain('contextMenus');
    });
  });

  describe('handleRequestPermission', () => {
    beforeEach(async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);
      await manager.renderPermissionCards();
      jest.clearAllMocks();
    });

    it('should request permission when request button clicked', async () => {
      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'notifications',
        granted: true,
      });
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(true);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'notifications',
          granted: true,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ]);

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPermissionManagerInstance.requestPermission).toHaveBeenCalledWith('notifications');
      expect(mockLogger.info).toHaveBeenCalledWith('Requesting permission', {
        permission: 'notifications',
      });
    });

    it('should show success message when permission granted', async () => {
      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'notifications',
        granted: true,
      });
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(true);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'notifications',
          granted: true,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ]);

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(statusMessageDiv.textContent).toContain(
        'Permission "notifications" granted successfully'
      );
      expect(statusMessageDiv.className).toContain('status-success');
      expect(statusMessageDiv.style.display).toBe('block');
    });

    it('should show error message when permission denied', async () => {
      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'notifications',
        granted: false,
      });

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(statusMessageDiv.textContent).toContain('Failed to grant permission');
      expect(statusMessageDiv.className).toContain('status-error');
    });

    it('should show error message with error details when request fails', async () => {
      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'notifications',
        granted: false,
        error: 'User gesture required',
      });

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(statusMessageDiv.textContent).toContain('User gesture required');
    });

    it('should handle exceptions during request', async () => {
      mockPermissionManagerInstance.requestPermission.mockRejectedValue(
        new Error('Request failed')
      );

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to request permission',
        expect.objectContaining({
          permission: 'notifications',
          error: expect.any(Error),
        })
      );
    });

    it('should refresh card after successful permission grant', async () => {
      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'notifications',
        granted: true,
      });
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(true);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'notifications',
          granted: true,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ]);

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Card should now show remove button instead of request button
      const card = container.querySelector('[data-permission="notifications"]');
      expect(card?.querySelector('.btn-remove-permission')).toBeTruthy();
      expect(card?.querySelector('.btn-request-permission')).toBeFalsy();
    });
  });

  describe('handleRemovePermission', () => {
    beforeEach(async () => {
      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'notifications',
          granted: true,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);
      await manager.renderPermissionCards();
      jest.clearAllMocks();
    });

    it('should remove permission when remove button clicked', async () => {
      mockPermissionManagerInstance.removePermission.mockResolvedValue(true);
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(false);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ]);

      const removeBtn = container.querySelector('.btn-remove-permission') as HTMLButtonElement;
      removeBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPermissionManagerInstance.removePermission).toHaveBeenCalledWith('notifications');
      expect(mockLogger.info).toHaveBeenCalledWith('Removing permission', {
        permission: 'notifications',
      });
    });

    it('should show success message when permission removed', async () => {
      mockPermissionManagerInstance.removePermission.mockResolvedValue(true);
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(false);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ]);

      const removeBtn = container.querySelector('.btn-remove-permission') as HTMLButtonElement;
      removeBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(statusMessageDiv.textContent).toContain(
        'Permission "notifications" removed successfully'
      );
      expect(statusMessageDiv.className).toContain('status-success');
    });

    it('should show error message when permission removal fails', async () => {
      mockPermissionManagerInstance.removePermission.mockResolvedValue(false);

      const removeBtn = container.querySelector('.btn-remove-permission') as HTMLButtonElement;
      removeBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(statusMessageDiv.textContent).toContain('Failed to remove permission');
      expect(statusMessageDiv.className).toContain('status-error');
    });

    it('should handle exceptions during removal', async () => {
      mockPermissionManagerInstance.removePermission.mockRejectedValue(new Error('Removal failed'));

      const removeBtn = container.querySelector('.btn-remove-permission') as HTMLButtonElement;
      removeBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to remove permission',
        expect.objectContaining({
          permission: 'notifications',
          error: expect.any(Error),
        })
      );
    });

    it('should refresh card after successful permission removal', async () => {
      mockPermissionManagerInstance.removePermission.mockResolvedValue(true);
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(false);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ]);

      const removeBtn = container.querySelector('.btn-remove-permission') as HTMLButtonElement;
      removeBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Card should now show request button instead of remove button
      const card = container.querySelector('[data-permission="notifications"]');
      expect(card?.querySelector('.btn-request-permission')).toBeTruthy();
      expect(card?.querySelector('.btn-remove-permission')).toBeFalsy();
    });
  });

  describe('refreshPermissionCard', () => {
    it('should handle permission not found error', async () => {
      // Mock getAllPermissions to return empty array
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(true);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([]);

      // Render initial cards
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'tabs',
          granted: false,
          description: 'Tabs',
          requiredFor: ['Recording'],
        },
      ]);
      await manager.renderPermissionCards();

      // Try to refresh with empty getAllPermissions result
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([]);
      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'tabs',
        granted: true,
      });

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalledWith('Permission status not found', {
        permission: 'tabs',
      });
    });
  });

  describe('showMessage', () => {
    it('should hide message after 3 seconds', async () => {
      jest.useFakeTimers();

      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);
      await manager.renderPermissionCards();

      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'notifications',
        granted: true,
      });
      mockPermissionManagerInstance.hasPermission.mockResolvedValue(true);
      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue([
        {
          permission: 'notifications',
          granted: true,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ]);

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;
      requestBtn.click();

      await Promise.resolve(); // Wait for click handler

      expect(statusMessageDiv.style.display).toBe('block');

      // Fast-forward time by 3 seconds
      jest.advanceTimersByTime(3000);

      expect(statusMessageDiv.style.display).toBe('none');

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing statusMessage element gracefully', async () => {
      // Remove status message element
      statusMessageDiv.remove();

      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'notifications',
          granted: false,
          description: 'Display notifications',
          requiredFor: ['Alerts'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);
      await manager.renderPermissionCards();

      mockPermissionManagerInstance.requestPermission.mockResolvedValue({
        permission: 'notifications',
        granted: true,
      });

      const requestBtn = container.querySelector('.btn-request-permission') as HTMLButtonElement;

      // Should not throw error even when statusMessage element is missing
      expect(() => requestBtn.click()).not.toThrow();
    });

    it('should handle missing permissions-list container', async () => {
      // Remove permissions-list
      const list = container.querySelector('.permissions-list');
      list?.remove();

      const mockPermissions: PermissionStatus[] = [
        {
          permission: 'tabs',
          granted: true,
          description: 'Tabs',
          requiredFor: ['Recording'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);

      // Should not throw error
      await expect(manager.renderPermissionCards()).resolves.not.toThrow();
    });

    it('should render correct icons for each permission type', async () => {
      const mockPermissions: PermissionStatus[] = [
        { permission: 'tabs', granted: true, description: 'Tabs', requiredFor: ['Recording'] },
        {
          permission: 'tabCapture',
          granted: true,
          description: 'Tab Capture',
          requiredFor: ['Recording'],
        },
        {
          permission: 'offscreen',
          granted: true,
          description: 'Offscreen',
          requiredFor: ['Recording'],
        },
        {
          permission: 'notifications',
          granted: true,
          description: 'Notifications',
          requiredFor: ['Alerts'],
        },
        {
          permission: 'contextMenus',
          granted: true,
          description: 'Context Menus',
          requiredFor: ['Menu'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);
      await manager.renderPermissionCards();

      const icons = container.querySelectorAll('.permission-icon');
      expect(icons).toHaveLength(5);
      expect(icons[0].textContent).toBe('📑'); // tabs
      expect(icons[1].textContent).toBe('🎥'); // tabCapture
      expect(icons[2].textContent).toBe('📄'); // offscreen
      expect(icons[3].textContent).toBe('🔔'); // notifications
      expect(icons[4].textContent).toBe('📋'); // contextMenus
    });

    it('should render correct permission names', async () => {
      const mockPermissions: PermissionStatus[] = [
        { permission: 'tabs', granted: true, description: 'Tabs', requiredFor: ['Recording'] },
        {
          permission: 'tabCapture',
          granted: true,
          description: 'Tab Capture',
          requiredFor: ['Recording'],
        },
        {
          permission: 'offscreen',
          granted: true,
          description: 'Offscreen',
          requiredFor: ['Recording'],
        },
        {
          permission: 'notifications',
          granted: true,
          description: 'Notifications',
          requiredFor: ['Alerts'],
        },
        {
          permission: 'contextMenus',
          granted: true,
          description: 'Context Menus',
          requiredFor: ['Menu'],
        },
      ];

      mockPermissionManagerInstance.getAllPermissions.mockResolvedValue(mockPermissions);
      await manager.renderPermissionCards();

      expect(container.textContent).toContain('Tabs Access');
      expect(container.textContent).toContain('Tab Capture');
      expect(container.textContent).toContain('Offscreen Document');
      expect(container.textContent).toContain('Notifications');
      expect(container.textContent).toContain('Context Menus');
    });
  });
});
