/**
 * Use Case: Import Automation Variables from CSV
 * Accepts CSV string and converts to entities
 * Following Clean Architecture: depends on domain interface, not infrastructure
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesCSVConverter } from '@domain/types/csv-converter.types';

export interface ImportAutomationVariablesInput {
  csvText: string;
}

export interface ImportAutomationVariablesOutput {
  success: boolean;
  error?: string;
}

export class ImportAutomationVariablesUseCase {
  constructor(
    private automationVariablesRepository: AutomationVariablesRepository,
    private csvConverter: AutomationVariablesCSVConverter,
    private websiteRepository?: WebsiteRepository
  ) {}

  async execute(input: ImportAutomationVariablesInput): Promise<ImportAutomationVariablesOutput> {
    const { csvText } = input;
    try {
      const automationVariablesDataList = this.csvConverter.fromCSV(csvText);

      // Validate websiteId references if WebsiteRepository is provided
      if (this.websiteRepository) {
        const validationResult = await this.validateWebsiteReferences(automationVariablesDataList);
        if (!validationResult.success) {
          return validationResult;
        }
      }

      // Save each automation variable
      for (const data of automationVariablesDataList) {
        // Use fromExisting to auto-generate ID if missing
        const automationVariables = AutomationVariables.fromExisting(data);
        const saveResult = await this.automationVariablesRepository.save(automationVariables);
        if (saveResult.isFailure) {
          return {
            success: false,
            error: `Failed to save automation variable: ${saveResult.error?.message || 'Unknown error'}`,
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import automation variables: ${error instanceof Error ? error.message : 'Invalid data'}`,
      };
    }
  }

  /**
   * Validate that all websiteId references exist in the system
   * @returns Result indicating success or error
   */
  private async validateWebsiteReferences(
    automationVariables: Array<{ websiteId: string; [key: string]: any }>
  ): Promise<ImportAutomationVariablesOutput> {
    // Get unique websiteIds
    const websiteIds = [...new Set(automationVariables.map((av) => av.websiteId).filter(Boolean))];

    if (websiteIds.length === 0) {
      return { success: true }; // No websiteId references to validate
    }

    // Load existing websites
    const loadResult = await this.websiteRepository!.load();
    if (loadResult.isFailure) {
      return {
        success: false,
        error: loadResult.error?.message || 'Failed to load websites for validation',
      };
    }

    const websiteCollection = loadResult.value!;
    const existingWebsiteIds = new Set(websiteCollection.getAll().map((w) => w.getId()));

    // Check for missing references
    const missingWebsiteIds = websiteIds.filter((id) => !existingWebsiteIds.has(id));

    if (missingWebsiteIds.length > 0) {
      return {
        success: false,
        error:
          `Cannot import Automation Variables: Referenced websites not found (${missingWebsiteIds.join(', ')}). ` +
          `Please import Websites CSV first, then import Automation Variables.`,
      };
    }

    return { success: true };
  }
}
