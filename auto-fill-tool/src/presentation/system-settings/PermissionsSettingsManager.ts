/**
 * Presentation Layer: Permissions Settings Manager
 * Manages permissions settings tab operations
 * Handles optional permission requests and displays permission status
 */

import { Logger } from '@domain/types/logger.types';
import { PermissionManager } from '@/infrastructure/adapters/PermissionManager';
import type {
  OptionalPermission,
  PermissionStatus,
} from '@/infrastructure/adapters/PermissionManager';
import { ChromeStorageLogAggregatorPort } from '@/infrastructure/adapters/ChromeStorageLogAggregatorAdapter';

export class PermissionsSettingsManager {
  private container: HTMLElement;
  private permissionCards: Map<OptionalPermission, HTMLElement> = new Map();
  private permissionManager: PermissionManager;

  constructor(private logger: Logger) {
    this.container = document.getElementById('permissions-tab') as HTMLElement;

    if (!this.container) {
      this.logger.error('Permissions settings tab element not found');
    }

    // Create PermissionManager instance with log aggregator
    const logAggregator = new ChromeStorageLogAggregatorPort();
    this.permissionManager = new PermissionManager(logAggregator);
  }

  /**
   * Render permission cards for all optional permissions
   */
  public async renderPermissionCards(): Promise<void> {
    try {
      const permissions = await this.permissionManager.getAllPermissions();
      this.clearContainer();

      permissions.forEach((permissionStatus: PermissionStatus) => {
        const card = this.createPermissionCard(permissionStatus);
        this.permissionCards.set(permissionStatus.permission, card);
        this.container.querySelector('.permissions-list')?.appendChild(card);
      });

      this.logger.info('Permission cards rendered', { count: permissions.length });
    } catch (error) {
      this.logger.error('Failed to render permission cards', error);
    }
  }

  /**
   * Create a permission card UI element
   */
  private createPermissionCard(status: PermissionStatus): HTMLElement {
    const card = document.createElement('div');
    card.className = 'permission-card';
    card.dataset.permission = status.permission;

    const icon = this.getPermissionIcon(status.permission);
    const statusBadge = status.granted
      ? '<span class="status-badge status-granted">✓ Granted</span>'
      : '<span class="status-badge status-not-granted">✗ Not Granted</span>';

    card.innerHTML = `
      <div class="permission-header">
        <div class="permission-icon">${icon}</div>
        <div class="permission-info">
          <div class="permission-name">${this.formatPermissionName(status.permission)}</div>
          <div class="permission-description">${status.description}</div>
        </div>
        ${statusBadge}
      </div>
      <div class="permission-details">
        <div class="required-for">
          <strong>Required for:</strong>
          <ul>
            ${status.requiredFor.map((feature) => `<li>${feature}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="permission-actions">
        ${
          status.granted
            ? `<button class="btn-remove-permission" data-permission="${status.permission}">
                 <span>🔓</span>
                 <span>Remove Permission</span>
               </button>`
            : `<button class="btn-request-permission" data-permission="${status.permission}">
                 <span>🔒</span>
                 <span>Request Permission</span>
               </button>`
        }
      </div>
    `;

    // Attach event listeners
    const requestBtn = card.querySelector('.btn-request-permission') as HTMLButtonElement;
    const removeBtn = card.querySelector('.btn-remove-permission') as HTMLButtonElement;

    if (requestBtn) {
      requestBtn.addEventListener('click', () => this.handleRequestPermission(status.permission));
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => this.handleRemovePermission(status.permission));
    }

    return card;
  }

  /**
   * Handle permission request button click
   * Note: Must be triggered from user gesture
   */
  private async handleRequestPermission(permission: OptionalPermission): Promise<void> {
    try {
      this.logger.info('Requesting permission', { permission });
      const result = await this.permissionManager.requestPermission(permission);

      if (result.granted) {
        this.showMessage(`Permission "${permission}" granted successfully`, 'success');
        await this.refreshPermissionCard(permission);
      } else {
        const errorMsg = result.error || 'Permission denied by user';
        this.showMessage(`Failed to grant permission: ${errorMsg}`, 'error');
      }
    } catch (error) {
      this.logger.error('Failed to request permission', { permission, error });
      this.showMessage(`Error requesting permission: ${error}`, 'error');
    }
  }

  /**
   * Handle permission removal button click
   */
  private async handleRemovePermission(permission: OptionalPermission): Promise<void> {
    try {
      this.logger.info('Removing permission', { permission });
      const removed = await this.permissionManager.removePermission(permission);

      if (removed) {
        this.showMessage(`Permission "${permission}" removed successfully`, 'success');
        await this.refreshPermissionCard(permission);
      } else {
        this.showMessage('Failed to remove permission', 'error');
      }
    } catch (error) {
      this.logger.error('Failed to remove permission', { permission, error });
      this.showMessage(`Error removing permission: ${error}`, 'error');
    }
  }

  /**
   * Refresh a single permission card after status change
   */
  private async refreshPermissionCard(permission: OptionalPermission): Promise<void> {
    const hasPermission = await this.permissionManager.hasPermission(permission);
    const allPermissions = await this.permissionManager.getAllPermissions();
    const permissionStatus = allPermissions.find(
      (p: PermissionStatus) => p.permission === permission
    );

    if (!permissionStatus) {
      this.logger.error('Permission status not found', { permission });
      return;
    }

    // Update status
    permissionStatus.granted = hasPermission;

    // Replace card
    const oldCard = this.permissionCards.get(permission);
    if (oldCard) {
      const newCard = this.createPermissionCard(permissionStatus);
      oldCard.replaceWith(newCard);
      this.permissionCards.set(permission, newCard);
    }
  }

  /**
   * Get icon for permission
   */
  private getPermissionIcon(permission: OptionalPermission): string {
    const icons: Record<OptionalPermission, string> = {
      tabs: '📑',
      tabCapture: '🎥',
      offscreen: '📄',
      notifications: '🔔',
      contextMenus: '📋',
    };
    return icons[permission] || '🔧';
  }

  /**
   * Format permission name for display
   */
  private formatPermissionName(permission: OptionalPermission): string {
    const names: Record<OptionalPermission, string> = {
      tabs: 'Tabs Access',
      tabCapture: 'Tab Capture',
      offscreen: 'Offscreen Document',
      notifications: 'Notifications',
      contextMenus: 'Context Menus',
    };
    return names[permission] || permission;
  }

  /**
   * Show status message
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';

    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  /**
   * Clear container
   */
  private clearContainer(): void {
    const list = this.container.querySelector('.permissions-list');
    if (list) {
      list.innerHTML = '';
    }
  }

  /**
   * Initialize the manager
   * Called when the permissions tab is first loaded
   */
  public async initialize(): Promise<void> {
    await this.renderPermissionCards();
  }
}
