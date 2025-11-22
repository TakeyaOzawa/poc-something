/**
 * PermissionManager Tests
 *
 * Comprehensive test suite for Chrome extension permission management
 */

import { PermissionManager } from '../PermissionManager';
import type { OptionalPermission } from '../PermissionManager';
import { LogAggregatorPort } from '@domain/ports/LogAggregatorPort';
import { LogEntry } from '@domain/entities/LogEntry';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock chrome.permissions API
const mockPermissions = {
  contains: jest.fn(),
  request: jest.fn(),
  remove: jest.fn(),
};

global.chrome = {
  permissions: mockPermissions,
} as any;

// Mock LogAggregatorPort
class MockLogAggregator implements LogAggregatorPort {
  private logs: LogEntry[] = [];

  async addLog(log: LogEntry): Promise<void> {
    this.logs.push(log);
  }

  async getLogs(): Promise<LogEntry[]> {
    return [...this.logs];
  }

  async getLogCount(): Promise<number> {
    return this.logs.length;
  }

  async deleteOldLogs(retentionDays: number): Promise<number> {
    return 0;
  }

  async clearAllLogs(): Promise<void> {
    this.logs = [];
  }

  async deleteLog(id: string): Promise<boolean> {
    const initialLength = this.logs.length;
    this.logs = this.logs.filter((log) => log.getId() !== id);
    return this.logs.length < initialLength;
  }

  async applyRotation(maxLogs: number): Promise<number> {
    const initialLength = this.logs.length;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
    return initialLength - this.logs.length;
  }
}

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;
  let mockLogAggregator: MockLogAggregator;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    mockLogAggregator = new MockLogAggregator();
    permissionManager = new PermissionManager(mockLogAggregator);
  });

  describe('hasPermission() - Check Permission Status', () => {
    it('should return true when permission is granted', async () => {
      mockPermissions.contains.mockResolvedValue(true);

      const result = await permissionManager.hasPermission('notifications');

      expect(result).toBe(true);
      expect(mockPermissions.contains).toHaveBeenCalledWith({
        permissions: ['notifications'],
      });
    });

    it('should return false when permission is not granted', async () => {
      mockPermissions.contains.mockResolvedValue(false);

      const result = await permissionManager.hasPermission('tabs');

      expect(result).toBe(false);
      expect(mockPermissions.contains).toHaveBeenCalledWith({
        permissions: ['tabs'],
      });
    });

    it('should return false when chrome.permissions.contains throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPermissions.contains.mockRejectedValue(new Error('Permission check failed'));

      const result = await permissionManager.hasPermission('contextMenus');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should check all optional permission types', async () => {
      const permissions: OptionalPermission[] = [
        'tabs',
        'tabCapture',
        'offscreen',
        'notifications',
        'contextMenus',
      ];

      mockPermissions.contains.mockResolvedValue(true);

      for (const permission of permissions) {
        const result = await permissionManager.hasPermission(permission);
        expect(result).toBe(true);
      }

      expect(mockPermissions.contains).toHaveBeenCalledTimes(5);
    });
  });

  describe('requestPermission() - Request Single Permission', () => {
    it('should return granted=true when user accepts permission request', async () => {
      mockPermissions.request.mockResolvedValue(true);

      const result = await permissionManager.requestPermission('notifications');

      expect(result).toEqual({
        permission: 'notifications',
        granted: true,
      });
      expect(mockPermissions.request).toHaveBeenCalledWith({
        permissions: ['notifications'],
      });
    });

    it('should return granted=false when user denies permission request', async () => {
      mockPermissions.request.mockResolvedValue(false);

      const result = await permissionManager.requestPermission('tabs');

      expect(result).toEqual({
        permission: 'tabs',
        granted: false,
      });
    });

    it('should return error when chrome.permissions.request throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorMessage = 'permissions.request may only be called during a user gesture';
      mockPermissions.request.mockRejectedValue(new Error(errorMessage));

      const result = await permissionManager.requestPermission('contextMenus');

      expect(result).toEqual({
        permission: 'contextMenus',
        granted: false,
        error: errorMessage,
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle non-Error thrown objects', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPermissions.request.mockRejectedValue('String error');

      const result = await permissionManager.requestPermission('tabs');

      expect(result.granted).toBe(false);
      expect(result.error).toBe('String error');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removePermission() - Remove Permission', () => {
    it('should return true when permission is successfully removed', async () => {
      mockPermissions.remove.mockResolvedValue(true);

      const result = await permissionManager.removePermission('notifications');

      expect(result).toBe(true);
      expect(mockPermissions.remove).toHaveBeenCalledWith({
        permissions: ['notifications'],
      });
    });

    it('should return false when permission removal fails', async () => {
      mockPermissions.remove.mockResolvedValue(false);

      const result = await permissionManager.removePermission('tabs');

      expect(result).toBe(false);
    });

    it('should return false when chrome.permissions.remove throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPermissions.remove.mockRejectedValue(new Error('Remove failed'));

      const result = await permissionManager.removePermission('contextMenus');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAllPermissions() - Get All Permission Statuses', () => {
    it('should return statuses for all optional permissions', async () => {
      // Mock: tabs and notifications granted, others not granted
      mockPermissions.contains.mockImplementation(async (details) => {
        const permission = details.permissions[0];
        return permission === 'tabs' || permission === 'notifications';
      });

      const result = await permissionManager.getAllPermissions();

      expect(result).toHaveLength(5);
      expect(result[0]).toMatchObject({
        permission: 'tabs',
        granted: true,
        description: expect.any(String),
        requiredFor: expect.any(Array),
      });
      expect(result[3]).toMatchObject({
        permission: 'notifications',
        granted: true,
      });
      expect(result[1]).toMatchObject({
        permission: 'tabCapture',
        granted: false,
      });
    });

    it('should include permission descriptions and required features', async () => {
      mockPermissions.contains.mockResolvedValue(false);

      const result = await permissionManager.getAllPermissions();

      result.forEach((status) => {
        expect(status.description).toBeTruthy();
        expect(status.requiredFor).toBeInstanceOf(Array);
        expect(status.requiredFor.length).toBeGreaterThan(0);
      });
    });

    it('should return all permissions as not granted when chrome API fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPermissions.contains.mockRejectedValue(new Error('API error'));

      const result = await permissionManager.getAllPermissions();

      expect(result).toHaveLength(5);
      result.forEach((status) => {
        expect(status.granted).toBe(false);
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('requestPermissions() - Request Multiple Permissions', () => {
    it('should request multiple permissions at once', async () => {
      mockPermissions.request.mockResolvedValue(true);

      const result = await permissionManager.requestPermissions(['tabs', 'notifications']);

      expect(result).toEqual([
        { permission: 'tabs', granted: true },
        { permission: 'notifications', granted: true },
      ]);
      expect(mockPermissions.request).toHaveBeenCalledWith({
        permissions: ['tabs', 'notifications'],
      });
    });

    it('should return granted=false for all permissions when user denies', async () => {
      mockPermissions.request.mockResolvedValue(false);

      const result = await permissionManager.requestPermissions([
        'tabs',
        'tabCapture',
        'offscreen',
      ]);

      expect(result).toEqual([
        { permission: 'tabs', granted: false },
        { permission: 'tabCapture', granted: false },
        { permission: 'offscreen', granted: false },
      ]);
    });

    it('should handle errors when requesting multiple permissions', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPermissions.request.mockRejectedValue(new Error('Request failed'));

      const result = await permissionManager.requestPermissions(['tabs', 'notifications']);

      expect(result).toEqual([
        { permission: 'tabs', granted: false, error: 'Request failed' },
        { permission: 'notifications', granted: false, error: 'Request failed' },
      ]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle empty permissions array', async () => {
      mockPermissions.request.mockResolvedValue(true);

      const result = await permissionManager.requestPermissions([]);

      expect(result).toEqual([]);
    });
  });

  describe('hasRecordingPermissions() - Check Recording Permissions', () => {
    it('should return true when all recording permissions are granted', async () => {
      mockPermissions.contains.mockResolvedValue(true);

      const result = await PermissionManager.hasRecordingPermissions();

      expect(result).toBe(true);
      expect(mockPermissions.contains).toHaveBeenCalledTimes(1);
      expect(mockPermissions.contains).toHaveBeenCalledWith({
        permissions: ['tabs', 'tabCapture', 'offscreen'],
      });
    });

    it('should return false when any recording permission is missing', async () => {
      // Mock: Chrome API returns false when not all permissions are granted
      mockPermissions.contains.mockResolvedValue(false);

      const result = await PermissionManager.hasRecordingPermissions();

      expect(result).toBe(false);
    });

    it('should return false when no recording permissions are granted', async () => {
      mockPermissions.contains.mockResolvedValue(false);

      const result = await PermissionManager.hasRecordingPermissions();

      expect(result).toBe(false);
    });

    it('should check only recording-related permissions (tabs, tabCapture, offscreen)', async () => {
      const containsSpy = mockPermissions.contains.mockResolvedValue(true);

      await PermissionManager.hasRecordingPermissions();

      expect(containsSpy).toHaveBeenCalledTimes(1);
      const calledPermissions = containsSpy.mock.calls[0][0].permissions;
      expect(calledPermissions).toEqual(['tabs', 'tabCapture', 'offscreen']);
      expect(calledPermissions).not.toContain('notifications');
      expect(calledPermissions).not.toContain('contextMenus');
    });
  });

  describe('requestRecordingPermissions() - Request Recording Permissions', () => {
    it('should return true when all recording permissions are granted', async () => {
      mockPermissions.request.mockResolvedValue(true);

      const result = await PermissionManager.requestRecordingPermissions();

      expect(result).toBe(true);
      expect(mockPermissions.request).toHaveBeenCalledWith({
        permissions: ['tabs', 'tabCapture', 'offscreen'],
      });
    });

    it('should return false when user denies recording permissions', async () => {
      mockPermissions.request.mockResolvedValue(false);

      const result = await PermissionManager.requestRecordingPermissions();

      expect(result).toBe(false);
    });

    it('should return false when request fails with error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPermissions.request.mockRejectedValue(new Error('User gesture required'));

      const result = await PermissionManager.requestRecordingPermissions();

      expect(result).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration - Real-world Usage Scenarios', () => {
    it('should handle recording feature workflow', async () => {
      // 1. Check if recording permissions are granted
      mockPermissions.contains.mockResolvedValue(false);
      const hasPermissions = await PermissionManager.hasRecordingPermissions();
      expect(hasPermissions).toBe(false);

      // 2. Request recording permissions
      mockPermissions.request.mockResolvedValue(true);
      const granted = await PermissionManager.requestRecordingPermissions();
      expect(granted).toBe(true);

      // 3. Verify permissions are now granted
      mockPermissions.contains.mockResolvedValue(true);
      const hasPermissionsAfter = await PermissionManager.hasRecordingPermissions();
      expect(hasPermissionsAfter).toBe(true);
    });

    it('should handle notification permission workflow', async () => {
      // 1. Check notification permission
      mockPermissions.contains.mockResolvedValue(false);
      const hasNotification = await permissionManager.hasPermission('notifications');
      expect(hasNotification).toBe(false);

      // 2. Request notification permission
      mockPermissions.request.mockResolvedValue(true);
      const result = await permissionManager.requestPermission('notifications');
      expect(result.granted).toBe(true);

      // 3. Verify permission is granted
      mockPermissions.contains.mockResolvedValue(true);
      const hasNotificationAfter = await permissionManager.hasPermission('notifications');
      expect(hasNotificationAfter).toBe(true);
    });

    it('should handle permission removal workflow', async () => {
      // 1. Verify permission is granted
      mockPermissions.contains.mockResolvedValue(true);
      const hasPermission = await permissionManager.hasPermission('contextMenus');
      expect(hasPermission).toBe(true);

      // 2. Remove permission
      mockPermissions.remove.mockResolvedValue(true);
      const removed = await permissionManager.removePermission('contextMenus');
      expect(removed).toBe(true);

      // 3. Verify permission is removed
      mockPermissions.contains.mockResolvedValue(false);
      const hasPermissionAfter = await permissionManager.hasPermission('contextMenus');
      expect(hasPermissionAfter).toBe(false);
    });

    it('should get all permissions status for settings UI', async () => {
      // Mock mixed permission states
      mockPermissions.contains.mockImplementation(async (details) => {
        const permission = details.permissions[0];
        // Only tabs and notifications granted
        return permission === 'tabs' || permission === 'notifications';
      });

      const allPermissions = await permissionManager.getAllPermissions();

      expect(allPermissions).toHaveLength(5);

      const granted = allPermissions.filter((p) => p.granted);
      const notGranted = allPermissions.filter((p) => !p.granted);

      expect(granted).toHaveLength(2);
      expect(notGranted).toHaveLength(3);

      // Verify structure for UI display
      allPermissions.forEach((status) => {
        expect(status).toHaveProperty('permission');
        expect(status).toHaveProperty('granted');
        expect(status).toHaveProperty('description');
        expect(status).toHaveProperty('requiredFor');
      });
    });
  });
});
