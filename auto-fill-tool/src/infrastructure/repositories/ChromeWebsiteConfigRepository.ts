/**
 * Infrastructure Layer: Chrome Website Config Repository
 * Repository for persisting website configurations to browser storage
 *
 * Note: This repository uses WebsiteConfig interface which is compatible with WebsiteData.
 * Status and variables have been moved to AutomationVariables entity.
 */

import browser from 'webextension-polyfill';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@/domain/constants/StorageKeys';
import { WebsiteData } from '@domain/entities/Website';
import { WebsiteMigrationService } from '@domain/services/WebsiteMigrationService';

/**
 * WebsiteConfig is now an alias for WebsiteData for backward compatibility
 */
export type WebsiteConfig = WebsiteData;

export class ChromeWebsiteConfigRepository {
  private migrationService: WebsiteMigrationService;

  constructor(private logger: Logger) {
    // Initialize domain service
    this.migrationService = new WebsiteMigrationService();
  }

  /**
   * Load websites from storage
   */
  async loadWebsites(): Promise<WebsiteConfig[]> {
    try {
      const result = await browser.storage.local.get(STORAGE_KEYS.WEBSITE_CONFIGS);
      if (result[STORAGE_KEYS.WEBSITE_CONFIGS]) {
        const websites: WebsiteConfig[] = JSON.parse(
          result[STORAGE_KEYS.WEBSITE_CONFIGS] as string
        );

        // Delegate migration to domain service
        const migrationResult = this.migrationService.migrateWebsites(websites);

        if (migrationResult.changed) {
          this.logger.info('Migrated website configurations with missing fields');
          await this.saveWebsites(migrationResult.migrated);
        }

        return migrationResult.migrated;
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to load websites', error);
      return [];
    }
  }

  /**
   * Save websites to storage
   */
  async saveWebsites(websites: WebsiteConfig[]): Promise<void> {
    try {
      await browser.storage.local.set({
        [STORAGE_KEYS.WEBSITE_CONFIGS]: JSON.stringify(websites),
      });
    } catch (error) {
      this.logger.error('Failed to save websites', error);
      throw error;
    }
  }
}
