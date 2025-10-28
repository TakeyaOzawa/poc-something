/**
 * Domain Layer: Website Migration Service
 * Handles data migration for website configurations
 * Business Rules: Default values for missing fields, backward compatibility
 */

import { WebsiteData } from '@domain/entities/Website';

/**
 * Migration result for a single website
 */
export interface WebsiteMigrationResult {
  migrated: WebsiteData;
  changed: boolean;
}

/**
 * Migration result for multiple websites
 */
export interface WebsitesMigrationResult {
  migrated: WebsiteData[];
  changed: boolean;
}

/**
 * Website Migration Service
 * Encapsulates business rules for website data migration
 *
 * Business Rules:
 * - updatedAt: Default to current timestamp if missing
 * - editable: Default to true if undefined
 * - Maintain backward compatibility with older data formats
 */
export class WebsiteMigrationService {
  /**
   * Migrate a single website configuration
   * Business Rule: Add missing fields with default values
   *
   * @param website Website data to migrate
   * @returns Migration result with changed flag
   */
  migrateWebsite(website: WebsiteData): WebsiteMigrationResult {
    let changed = false;
    const migrated: WebsiteData = { ...website };

    // Business Rule: updatedAt defaults to current timestamp
    if (!migrated.updatedAt) {
      migrated.updatedAt = new Date().toISOString();
      changed = true;
    }

    // Business Rule: editable defaults to true
    if (migrated.editable === undefined) {
      migrated.editable = true;
      changed = true;
    }

    return { migrated, changed };
  }

  /**
   * Migrate multiple website configurations
   *
   * @param websites Array of website data to migrate
   * @returns Migration result with changed flag (true if any website changed)
   */
  migrateWebsites(websites: WebsiteData[]): WebsitesMigrationResult {
    let anyChanged = false;
    const migrated = websites.map((website) => {
      const result = this.migrateWebsite(website);
      if (result.changed) {
        anyChanged = true;
      }
      return result.migrated;
    });

    return { migrated, changed: anyChanged };
  }

  /**
   * Check if a website needs migration
   *
   * @param website Website data to check
   * @returns true if migration is needed
   */
  needsMigration(website: WebsiteData): boolean {
    return !website.updatedAt || website.editable === undefined;
  }

  /**
   * Get missing fields in a website configuration
   *
   * @param website Website data to check
   * @returns Array of missing field names
   */
  getMissingFields(website: WebsiteData): string[] {
    const missing: string[] = [];

    if (!website.updatedAt) {
      missing.push('updatedAt');
    }

    if (website.editable === undefined) {
      missing.push('editable');
    }

    return missing;
  }

  /**
   * Get migration statistics
   *
   * @param websites Array of website data
   * @returns Statistics about migration needs
   */
  getMigrationStats(websites: WebsiteData[]): {
    total: number;
    needsMigration: number;
    missingUpdatedAt: number;
    missingEditable: number;
  } {
    const total = websites.length;
    let needsMigration = 0;
    let missingUpdatedAt = 0;
    let missingEditable = 0;

    for (const website of websites) {
      const fields = this.getMissingFields(website);
      if (fields.length > 0) {
        needsMigration++;
      }
      if (fields.includes('updatedAt')) {
        missingUpdatedAt++;
      }
      if (fields.includes('editable')) {
        missingEditable++;
      }
    }

    return {
      total,
      needsMigration,
      missingUpdatedAt,
      missingEditable,
    };
  }
}
