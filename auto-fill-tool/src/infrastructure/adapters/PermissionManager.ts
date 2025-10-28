/**
 * Permission Manager
 *
 * Manages Chrome extension optional permissions following the principle of least privilege.
 * Provides methods to request, check, and remove optional permissions at runtime.
 *
 * Supported Optional Permissions:
 * - tabs: Required for tab information access (recording feature)
 * - tabCapture: Required for tab capture (recording feature)
 * - offscreen: Required for offscreen document (recording feature)
 * - notifications: Required for displaying notifications
 * - contextMenus: Required for context menu integration
 *
 * @see https://developer.chrome.com/docs/extensions/reference/permissions/
 */

import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { SecurityEventLogger } from '@domain/services/SecurityEventLogger';

/**
 * Optional permission types supported by this extension
 */
export type OptionalPermission =
  | 'tabs'
  | 'tabCapture'
  | 'offscreen'
  | 'notifications'
  | 'contextMenus';

/**
 * Permission status result
 */
export interface PermissionStatus {
  permission: OptionalPermission;
  granted: boolean;
  description: string;
  requiredFor: string[];
}

/**
 * Permission request result
 */
export interface PermissionRequestResult {
  permission: OptionalPermission;
  granted: boolean;
  error?: string;
}

/**
 * Permission Manager Service
 *
 * Provides centralized management of optional permissions.
 * Uses Chrome Permissions API to request/check/remove permissions at runtime.
 */
export class PermissionManager {
  /**
   * Permission descriptions and usage information
   */
  private static readonly PERMISSION_INFO: Record<
    OptionalPermission,
    { description: string; requiredFor: string[] }
  > = {
    tabs: {
      description: 'Access tab information for recording',
      requiredFor: ['Recording feature', 'Tab monitoring'],
    },
    tabCapture: {
      description: 'Capture tab content for recording',
      requiredFor: ['Recording feature', 'Screen capture'],
    },
    offscreen: {
      description: 'Create offscreen documents for recording',
      requiredFor: ['Recording feature', 'Background processing'],
    },
    notifications: {
      description: 'Display system notifications',
      requiredFor: ['Completion notifications', 'Error alerts'],
    },
    contextMenus: {
      description: 'Add context menu items',
      requiredFor: ['Right-click menu integration'],
    },
  };

  /**
   * Constructor
   * @param logAggregator - Log aggregator for security events
   */
  constructor(private readonly logAggregator: LogAggregatorPort) {}

  /**
   * Check if a specific permission is granted
   *
   * @param permission - Permission to check
   * @returns Promise resolving to true if granted, false otherwise
   *
   * @example
   * const hasNotifications = await permissionManager.hasPermission('notifications');
   * if (!hasNotifications) {
   *   // Request permission before showing notification
   * }
   */
  async hasPermission(permission: OptionalPermission): Promise<boolean> {
    try {
      const result = await chrome.permissions.contains({
        permissions: [permission],
      });
      return result;
    } catch (error) {
      console.error(`Failed to check permission: ${permission}`, error);
      return false;
    }
  }

  /**
   * Request a specific optional permission
   *
   * Important: Must be called from a user gesture (e.g., button click)
   * to avoid "permissions.request may only be called during a user gesture" error.
   *
   * @param permission - Permission to request
   * @returns Promise resolving to result with granted status
   *
   * @example
   * // In a button click handler
   * async function handleRecordingStart() {
   *   const result = await permissionManager.requestPermission('tabs');
   *   if (result.granted) {
   *     // Start recording
   *   } else {
   *     alert('Recording requires tab access permission');
   *   }
   * }
   */
  async requestPermission(permission: OptionalPermission): Promise<PermissionRequestResult> {
    try {
      const granted = await chrome.permissions.request({
        permissions: [permission],
      });

      // Log security event: PERMISSION_DENIED
      if (!granted) {
        const deniedLog = SecurityEventLogger.createPermissionDenied(
          'PermissionManager',
          `Permission denied: ${permission}`,
          {
            permission,
            reason: 'User declined permission request',
          }
        );
        await this.logAggregator.addLog(deniedLog);
      }

      return {
        permission,
        granted,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to request permission: ${permission}`, error);

      // Log security event: PERMISSION_DENIED
      const deniedLog = SecurityEventLogger.createPermissionDenied(
        'PermissionManager',
        `Permission request failed: ${permission}`,
        {
          permission,
          error: errorMessage,
        }
      );
      await this.logAggregator.addLog(deniedLog);

      return {
        permission,
        granted: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Remove a specific optional permission
   *
   * @param permission - Permission to remove
   * @returns Promise resolving to true if successfully removed, false otherwise
   *
   * @example
   * // User disabled recording feature
   * const removed = await permissionManager.removePermission('tabCapture');
   * if (removed) {
   *   // Update UI to reflect permission removal
   * }
   */
  async removePermission(permission: OptionalPermission): Promise<boolean> {
    try {
      const result = await chrome.permissions.remove({
        permissions: [permission],
      });
      return result;
    } catch (error) {
      console.error(`Failed to remove permission: ${permission}`, error);
      return false;
    }
  }

  /**
   * Get status of all optional permissions
   *
   * @returns Promise resolving to array of permission statuses
   *
   * @example
   * const statuses = await permissionManager.getAllPermissions();
   * statuses.forEach(status => {
   *   console.log(`${status.permission}: ${status.granted ? 'Granted' : 'Not granted'}`);
   * });
   */
  async getAllPermissions(): Promise<PermissionStatus[]> {
    const permissions: OptionalPermission[] = [
      'tabs',
      'tabCapture',
      'offscreen',
      'notifications',
      'contextMenus',
    ];

    const statuses = await Promise.all(
      permissions.map(async (permission) => {
        const granted = await this.hasPermission(permission);
        const info = PermissionManager.PERMISSION_INFO[permission];

        return {
          permission,
          granted,
          description: info.description,
          requiredFor: info.requiredFor,
        };
      })
    );

    return statuses;
  }

  /**
   * Request multiple permissions at once
   *
   * Important: Must be called from a user gesture (e.g., button click).
   *
   * @param permissions - Array of permissions to request
   * @returns Promise resolving to array of request results
   *
   * @example
   * // Request all recording-related permissions
   * const results = await permissionManager.requestPermissions(['tabs', 'tabCapture', 'offscreen']);
   * const allGranted = results.every(r => r.granted);
   * if (allGranted) {
   *   // Start recording
   * }
   */
  async requestPermissions(permissions: OptionalPermission[]): Promise<PermissionRequestResult[]> {
    try {
      const granted = await chrome.permissions.request({
        permissions,
      });

      // Log security event: PERMISSION_DENIED for denied permissions
      if (!granted) {
        const deniedLog = SecurityEventLogger.createPermissionDenied(
          'PermissionManager',
          `Multiple permissions denied: ${permissions.join(', ')}`,
          {
            permissions: permissions.join(', '),
            reason: 'User declined permission request',
          }
        );
        await this.logAggregator.addLog(deniedLog);
      }

      return permissions.map((permission) => ({
        permission,
        granted,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to request multiple permissions', error);

      // Log security event: PERMISSION_DENIED
      const deniedLog = SecurityEventLogger.createPermissionDenied(
        'PermissionManager',
        `Multiple permissions request failed: ${permissions.join(', ')}`,
        {
          permissions: permissions.join(', '),
          error: errorMessage,
        }
      );
      await this.logAggregator.addLog(deniedLog);

      return permissions.map((permission) => ({
        permission,
        granted: false,
        error: errorMessage,
      }));
    }
  }

  /**
   * Check if all recording-related permissions are granted
   *
   * Convenience method to check all permissions required for recording feature.
   *
   * @returns Promise resolving to true if all recording permissions are granted
   *
   * @example
   * const canRecord = await PermissionManager.hasRecordingPermissions();
   * if (!canRecord) {
   *   // Show permission request dialog
   * }
   */
  static async hasRecordingPermissions(): Promise<boolean> {
    try {
      const result = await chrome.permissions.contains({
        permissions: ['tabs', 'tabCapture', 'offscreen'],
      });
      return result;
    } catch (error) {
      console.error('Failed to check recording permissions', error);
      return false;
    }
  }

  /**
   * Request all recording-related permissions at once
   *
   * Important: Must be called from a user gesture (e.g., button click).
   *
   * @returns Promise resolving to true if all permissions are granted
   *
   * @example
   * // In recording start button handler
   * async function handleStartRecording() {
   *   const granted = await PermissionManager.requestRecordingPermissions();
   *   if (granted) {
   *     // Start recording
   *   } else {
   *     alert('Recording requires additional permissions');
   *   }
   * }
   */
  static async requestRecordingPermissions(): Promise<boolean> {
    try {
      const granted = await chrome.permissions.request({
        permissions: ['tabs', 'tabCapture', 'offscreen'],
      });
      return granted;
    } catch (error) {
      console.error('Failed to request recording permissions', error);
      return false;
    }
  }
}
