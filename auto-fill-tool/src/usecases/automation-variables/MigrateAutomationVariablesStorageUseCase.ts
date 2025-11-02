/**
 * Use Case: Migrate Automation Variables Storage
 * Converts legacy object format to new array format
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import browser from 'webextension-polyfill';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { IdGenerator } from '@domain/types/id-generator.types';

export interface MigrateAutomationVariablesStorageOutput {
  migrated: boolean;
  count: number;
  errors: string[];
}

export class MigrateAutomationVariablesStorageUseCase {
  constructor(
    private automationVariablesRepository: AutomationVariablesRepository,
    private idGenerator: IdGenerator
  ) {}

  async execute(): Promise<MigrateAutomationVariablesStorageOutput> {
    try {
      // Check if migration is needed
      const result = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
      const storage = result[STORAGE_KEYS.AUTOMATION_VARIABLES];

      // No data to migrate
      if (!storage) {
        return { migrated: false, count: 0, errors: [] };
      }

      // Already in array format
      if (Array.isArray(storage)) {
        return { migrated: false, count: storage.length, errors: [] };
      }

      // Migrate from object format to array format
      const errors: string[] = [];
      const entries = Object.entries(storage);
      const migratedData: any[] = [];

      for (const [websiteId, data] of entries) {
        try {
          // Check if data already has an id
          const dataWithId = data as any;
          const vars = dataWithId.id
            ? AutomationVariables.fromExisting(dataWithId)
            : AutomationVariables.create(
                {
                  websiteId,
                  variables: dataWithId.variables || {},
                  status: dataWithId.status,
                },
                this.idGenerator
              );

          migratedData.push(vars.toData());
        } catch (error) {
          errors.push(`Failed to migrate websiteId ${websiteId}: ${error}`);
        }
      }

      // Save migrated data
      await browser.storage.local.set({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: migratedData,
      });

      return {
        migrated: true,
        count: migratedData.length,
        errors,
      };
    } catch (error) {
      return {
        migrated: false,
        count: 0,
        errors: [`Migration failed: ${error}`],
      };
    }
  }
}
