/**
 * Application Layer: Execute Receive Data Use Case
 * Fetches data from external APIs (Notion/Spreadsheet) and saves to Chrome Storage
 *
 * This is the new architecture implementation that uses:
 * - inputs configuration (API keys, database IDs, etc.)
 * - outputs configuration (storage keys, default values)
 * - Specialized adapters (NotionSyncPort, SpreadsheetSyncPort)
 *
 * Replaces the legacy ExecuteReceiveStepsUseCase which used receiveSteps.
 */

import browser from 'webextension-polyfill';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { NotionSyncPort, NotionPageData } from '@domain/types/notion-sync-port.types';
import { SpreadsheetSyncPort } from '@domain/types/spreadsheet-sync-port.types';
import { Logger } from '@domain/types/logger.types';
import { DataTransformationService } from '@domain/services/DataTransformationService';
import { DataTransformer } from '@domain/entities/DataTransformer';

export interface ExecuteReceiveDataInput {
  config: StorageSyncConfig;
}

export interface ExecuteReceiveDataOutput {
  success: boolean;
  receivedCount?: number;
  error?: string;
}

/**
 * Use Case: Execute Receive Data
 *
 * Responsibilities:
 * - Connect to external API using inputs configuration
 * - Fetch data from API using appropriate adapter
 * - Transform data if transformation config exists
 * - Save received data to Chrome Storage based on outputs configuration
 * - Handle errors with detailed reporting
 */
export class ExecuteReceiveDataUseCase {
  private transformationService: DataTransformationService;

  constructor(
    private notionAdapter: NotionSyncPort,
    private spreadsheetAdapter: SpreadsheetSyncPort,
    private logger: Logger
  ) {
    this.transformationService = new DataTransformationService(
      logger.createChild('DataTransformation')
    );
  }

  async execute(input: ExecuteReceiveDataInput): Promise<ExecuteReceiveDataOutput> {
    const { config } = input;

    try {
      this.logger.info('Executing receive data for config', {
        storageKey: config.getStorageKey(),
        syncMethod: config.getSyncMethod(),
      });

      // Select appropriate adapter
      const adapter = this.selectAdapter(config.getSyncMethod());

      // Connect to API
      await adapter.connect(config.getInputs());

      // Fetch data
      const rawData = await this.fetchData(adapter, config);

      this.logger.info('Data fetched successfully', {
        recordCount: Array.isArray(rawData) ? rawData.length : 'N/A',
      });

      // Transform data if transformation config exists
      const transformedData = this.transformData(rawData, config);

      // Save to Chrome Storage
      await this.saveToStorage(transformedData, config);

      // Count records (for arrays of objects, count elements; for other data types, count as 1)
      let receivedCount = 1;
      if (Array.isArray(transformedData)) {
        if (transformedData.length === 0) {
          receivedCount = 0;
        } else if (typeof transformedData[0] === 'object' && !Array.isArray(transformedData[0])) {
          // Array of objects (typical for Notion pages), count the objects
          receivedCount = transformedData.length;
        }
        // For 2D arrays (spreadsheet data), keep as 1 dataset
      }

      return {
        success: true,
        receivedCount,
      };
    } catch (error) {
      this.logger.error('Failed to execute receive data', error, {
        storageKey: config.getStorageKey(),
        syncMethod: config.getSyncMethod(),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Select adapter based on sync method
   */
  private selectAdapter(
    syncMethod: 'notion' | 'spread-sheet'
  ): NotionSyncPort | SpreadsheetSyncPort {
    switch (syncMethod) {
      case 'notion':
        return this.notionAdapter;
      case 'spread-sheet':
        return this.spreadsheetAdapter;
      default:
        throw new Error(`Unsupported sync method: ${syncMethod}`);
    }
  }

  /**
   * Fetch data from adapter
   */
  private async fetchData(
    adapter: NotionSyncPort | SpreadsheetSyncPort,
    config: StorageSyncConfig
  ): Promise<unknown> {
    const inputs = config.getInputs();

    if ('queryDatabase' in adapter) {
      // Notion adapter
      const databaseIdInput = inputs.find((input) => input.key === 'databaseId');
      if (!databaseIdInput || !databaseIdInput.value) {
        throw new Error('databaseId not found in inputs for Notion sync');
      }

      const databaseId = databaseIdInput.value as string;
      const pagesResult = await adapter.queryDatabase(databaseId);

      if (pagesResult.isFailure) {
        throw pagesResult.error!;
      }

      const pages = pagesResult.value;
      if (!pages) {
        throw new Error('No pages data received from Notion');
      }

      return this.convertNotionPagesToData(pages);
    } else if ('getSheetData' in adapter) {
      // Spreadsheet adapter
      const spreadsheetIdInput = inputs.find((input) => input.key === 'spreadsheetId');
      const rangeInput = inputs.find((input) => input.key === 'range');

      if (!spreadsheetIdInput || !spreadsheetIdInput.value) {
        throw new Error('spreadsheetId not found in inputs for Spreadsheet sync');
      }
      if (!rangeInput || !rangeInput.value) {
        throw new Error('range not found in inputs for Spreadsheet sync');
      }

      const spreadsheetId = spreadsheetIdInput.value as string;
      const range = rangeInput.value as string;

      return await adapter.getSheetData(spreadsheetId, range);
    }

    throw new Error('Unsupported adapter type');
  }

  /**
   * Convert Notion pages to data array
   */
  private convertNotionPagesToData(pages: NotionPageData[]): unknown[] {
    return pages.map((page) => ({
      id: page.id,
      ...page.properties,
      createdTime: page.createdTime,
      lastEditedTime: page.lastEditedTime,
    }));
  }

  /**
   * Transform data if transformation config exists
   */
  private transformData(data: unknown, config: StorageSyncConfig): unknown {
    const transformerConfig = config.getTransformerConfig();
    if (!transformerConfig) {
      return data;
    }

    this.logger.info('Applying data transformation');
    const transformer = DataTransformer.fromData(transformerConfig);
    const result = this.transformationService.transform(data, transformer);
    return result.success ? result.data : data;
  }

  /**
   * Save data to Chrome Storage based on outputs configuration
   */
  private async saveToStorage(data: unknown, config: StorageSyncConfig): Promise<void> {
    const outputs = config.getOutputs();

    if (outputs.length === 0) {
      throw new Error('No outputs configured');
    }

    // Build storage object from outputs
    const storageData: Record<string, unknown> = {};

    for (const output of outputs) {
      // Use the received data or default value
      storageData[output.key] = data !== undefined ? data : output.defaultValue;
    }

    this.logger.info('Saving data to Chrome Storage', {
      keys: Object.keys(storageData),
    });

    await browser.storage.local.set(storageData);
  }
}
