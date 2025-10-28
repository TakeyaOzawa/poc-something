/**
 * Infrastructure Layer: Chrome Context Menu Adapter
 * Manages creation and updates of Chrome extension context menus
 */

import browser from 'webextension-polyfill';
import { Logger } from '@domain/types/logger.types';
import { WebsiteData } from '@domain/entities/Website';
import { STORAGE_KEYS } from '@/domain/constants/StorageKeys';
import { CONTEXT_MENU_IDS, getWebsiteContextMenuId } from '@domain/constants/ContextMenuIds';
import { I18nAdapter } from './I18nAdapter';

export class ChromeContextMenuAdapter {
  private isInitialized = false;
  private isCreating = false;

  constructor(private logger: Logger) {}

  /**
   * Initialize context menus and set up listeners
   */
  async initialize(): Promise<void> {
    // Prevent duplicate initialization
    if (this.isInitialized) {
      this.logger.warn('Context menu service already initialized');
      return;
    }

    this.isInitialized = true;

    // Create menus on install
    browser.runtime.onInstalled.addListener(async () => {
      await this.createContextMenus();
    });

    // Update menus when storage changes
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.websiteConfigs) {
        this.createContextMenus();
      }
    });

    // Initial creation
    await this.createContextMenus();
  }

  /**
   * Create all context menus
   */
  async createContextMenus(): Promise<void> {
    // Prevent concurrent execution
    if (this.isCreating) {
      this.logger.debug('Context menu creation already in progress, skipping');
      return;
    }

    this.isCreating = true;

    try {
      // Remove all existing menus first
      await browser.contextMenus.removeAll();

      // Wait for cleanup to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create parent menu and wait for completion
      await browser.contextMenus.create({
        id: CONTEXT_MENU_IDS.GET_XPATH,
        title: I18nAdapter.getMessage('getXPath'),
        contexts: ['all'],
      });

      // Create "XPathを表示する" menu
      await browser.contextMenus.create({
        id: CONTEXT_MENU_IDS.SHOW_XPATH,
        title: I18nAdapter.getMessage('showXPath'),
        contexts: ['all'],
      });

      // Load websites and create submenus
      const result = await browser.storage.local.get(STORAGE_KEYS.WEBSITE_CONFIGS);
      if (result.websiteConfigs) {
        const websites: WebsiteData[] = JSON.parse(result.websiteConfigs as string);

        // Filter editable websites and sort by updatedAt (newest first)
        const editableWebsites = websites
          .filter((w) => w.editable)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        // Create submenu for each editable website
        for (const website of editableWebsites) {
          await browser.contextMenus.create({
            id: getWebsiteContextMenuId(website.id),
            parentId: CONTEXT_MENU_IDS.GET_XPATH,
            title: website.name,
            contexts: ['all'],
          });
        }

        // Add "新規作成" submenu at the end
        await browser.contextMenus.create({
          id: CONTEXT_MENU_IDS.GET_XPATH_NEW,
          parentId: CONTEXT_MENU_IDS.GET_XPATH,
          title: I18nAdapter.getMessage('createNew'),
          contexts: ['all'],
        });
      }

      this.logger.info('Context menus created successfully');
    } catch (error) {
      this.logger.error('Failed to create context menus', error);
    } finally {
      this.isCreating = false;
    }
  }
}
