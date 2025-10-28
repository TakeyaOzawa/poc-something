/**
 * Alpine.js Component for Popup UI
 *
 * This file provides Alpine.js reactive data and methods for the popup interface.
 * It works alongside the existing PopupController and WebsiteListPresenter.
 * Integrates with Atomic Design components for rendering.
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */

import browser from 'webextension-polyfill';
import { WebsiteData } from '@domain/entities/Website';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { renderWebsiteCard } from './components/molecules/WebsiteCard';

export interface PopupAppData {
  // Data
  websites: WebsiteData[];
  automationVariablesMap: Map<string, AutomationVariables>;
  editingId: string | null;
  showModal: boolean;

  // Computed
  isEmpty(): boolean;
  getWebsiteStatus(websiteId: string): string;
  getWebsiteStatusClass(websiteId: string): 'enabled' | 'disabled' | 'once';
  getWebsiteVariablesText(websiteId: string): string;

  // Rendering
  renderWebsiteCard(website: WebsiteData): string;

  // Methods
  setWebsites(websites: WebsiteData[], avMap: Map<string, AutomationVariables>): void;
  openModal(id: string | null): void;
  openAddModal(): void;
  closeModal(): void;
  handleExecute(websiteId: string): void;
  handleEdit(websiteId: string): void;
  handleDelete(websiteId: string): void;

  // Navigation methods
  openXPathManager(): void;
  openAutomationVariablesManager(): void;
  openDataSyncSettings(): void;
  openSettings(): void;
}

/**
 * Create Alpine.js data object for popup
 */
// eslint-disable-next-line max-lines-per-function -- Alpine.js reactive data object definition with computed properties (isEmpty, getWebsiteStatus, getWebsiteStatusClass, getWebsiteVariablesText, renderWebsiteCard), state management methods (setWebsites, openModal, closeModal), action handlers (handleExecute, handleEdit, handleDelete), and navigation methods (openXPathManager, etc.). Splitting would break Alpine.js data binding structure and reduce code cohesion.
export function createPopupApp(): PopupAppData {
  return {
    // Reactive data
    websites: [],
    automationVariablesMap: new Map(),
    editingId: null,
    showModal: false,

    // Computed properties
    isEmpty(): boolean {
      return this.websites.length === 0;
    },

    getWebsiteStatus(websiteId: string): string {
      const av = this.automationVariablesMap.get(websiteId);
      const status = av?.getStatus() || AUTOMATION_STATUS.ONCE;

      const statusLabels = {
        [AUTOMATION_STATUS.DISABLED]: I18nAdapter.getMessage('statusDisabled'),
        [AUTOMATION_STATUS.ENABLED]: I18nAdapter.getMessage('statusEnabled'),
        [AUTOMATION_STATUS.ONCE]: I18nAdapter.getMessage('statusOnce'),
      };

      return statusLabels[status] || status;
    },

    getWebsiteStatusClass(websiteId: string): 'enabled' | 'disabled' | 'once' {
      const av = this.automationVariablesMap.get(websiteId);
      const status = av?.getStatus() || AUTOMATION_STATUS.ONCE;

      const statusMapping: Record<string, 'enabled' | 'disabled' | 'once'> = {
        [AUTOMATION_STATUS.DISABLED]: 'disabled',
        [AUTOMATION_STATUS.ENABLED]: 'enabled',
        [AUTOMATION_STATUS.ONCE]: 'once',
      };

      return statusMapping[status] || 'once';
    },

    getWebsiteVariablesText(websiteId: string): string {
      const av = this.automationVariablesMap.get(websiteId);
      const variables = av?.getVariables() || {};

      if (Object.keys(variables).length === 0) {
        return I18nAdapter.getMessage('noVariables');
      }

      return Object.entries(variables)
        .map(([k, v]) => `{{${k}}}=${v}`)
        .join(', ');
    },

    // Rendering
    renderWebsiteCard(website: WebsiteData): string {
      return renderWebsiteCard({
        id: website.id,
        name: website.name,
        status: this.getWebsiteStatusClass(website.id),
        statusText: this.getWebsiteStatus(website.id),
        variables: this.getWebsiteVariablesText(website.id),
        onExecute: 'handleExecute',
        onEdit: 'handleEdit',
        onDelete: 'handleDelete',
      });
    },

    // Methods
    setWebsites(websites: WebsiteData[], avMap: Map<string, AutomationVariables>): void {
      this.websites = websites;
      this.automationVariablesMap = avMap;
    },

    openModal(id: string | null): void {
      this.editingId = id;
      this.showModal = true;
    },

    openAddModal(): void {
      this.openModal(null);
    },

    closeModal(): void {
      this.showModal = false;
      this.editingId = null;
    },

    // Navigation methods
    openXPathManager(): void {
      browser.tabs.create({ url: browser.runtime.getURL('xpath-manager.html') });
    },

    openAutomationVariablesManager(): void {
      browser.tabs.create({ url: browser.runtime.getURL('automation-variables-manager.html') });
    },

    openDataSyncSettings(): void {
      // This will be handled by PopupController's data sync method
      const event = new CustomEvent('dataSyncRequest');
      window.dispatchEvent(event);
    },

    openSettings(): void {
      browser.tabs.create({ url: browser.runtime.getURL('system-settings.html') });
    },

    handleExecute(websiteId: string): void {
      // Delegate to WebsiteActionHandler via global controller
      const event = new CustomEvent('websiteAction', {
        detail: { action: 'execute', id: websiteId },
      });
      window.dispatchEvent(event);
    },

    handleEdit(websiteId: string): void {
      // Delegate to WebsiteListPresenter
      const event = new CustomEvent('websiteAction', {
        detail: { action: 'edit', id: websiteId },
      });
      window.dispatchEvent(event);
    },

    handleDelete(websiteId: string): void {
      // Delegate to WebsiteListPresenter
      const event = new CustomEvent('websiteAction', {
        detail: { action: 'delete', id: websiteId },
      });
      window.dispatchEvent(event);
    },
  };
}

/**
 * Initialize popup Alpine.js component
 * This should be called after Alpine.js is loaded
 */
export function initPopupAlpine(): void {
  // Register as a global Alpine component factory
  if (typeof window !== 'undefined') {
    (window as any).popupApp = createPopupApp;
  }
}
