/**
 * Application Layer: Execute Send Data Use Case
 * Reads data from Chrome Storage and sends to external APIs (Notion/Spreadsheet)
 *
 * This is the new architecture implementation that uses:
 * - inputs configuration (API keys, database IDs, etc.)
 * - outputs configuration (data source keys in Chrome Storage)
 * - Specialized adapters (NotionSyncPort, SpreadsheetSyncPort)
 *
 * Replaces the legacy ExecuteSendStepsUseCase which used sendSteps.
 */

import browser from 'webextension-polyfill';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { NotionSyncPort } from '@domain/types/notion-sync-port.types';
import { SpreadsheetSyncPort } from '@domain/types/spreadsheet-sync-port.types';
import { Logger } from '@domain/types/logger.types';
import { DataTransformationService } from '@domain/services/DataTransformationService';
import { DataTransformer } from '@domain/entities/DataTransformer';

export interface ExecuteSendDataInput {
  config: StorageSyncConfig;
}

export interface ExecuteSendDataOutput {
  success: boolean;
  sentCount?: number;
  error?: string;
}

/**
 * Use Case: Execute Send Data
 *
 * Responsibilities:
 * - Read data from Chrome Storage based on outputs configuration
 * - Connect to external API using inputs configuration
 * - Transform data if transformation config exists
 * - Send data to API using appropriate adapter
 * - Handle errors with detailed reporting
 */
export class ExecuteSendDataUseCase {
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

  async execute(input: ExecuteSendDataInput): Promise<ExecuteSendDataOutput> {
    const { config } = input;

    try {
      this.logger.info('Executing send data for config', {
        storageKey: config.getStorageKey(),
        syncMethod: config.getSyncMethod(),
      });

      // Read data from Chrome Storage
      const rawData = await this.readFromStorage(config);

      this.logger.info('Data read from Chrome Storage', {
        recordCount: Array.isArray(rawData) ? rawData.length : 'N/A',
      });

      // Transform data if transformation config exists
      const transformedData = this.transformData(rawData, config);

      // Select appropriate adapter
      const adapter = this.selectAdapter(config.getSyncMethod());

      // Connect to API
      await adapter.connect(config.getInputs());

      // Send data
      const sentCount = await this.sendData(adapter, transformedData, config);

      return {
        success: true,
        sentCount,
      };
    } catch (error) {
      this.logger.error('Failed to execute send data', error, {
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
   * Read data from Chrome Storage based on outputs configuration
   * Outputs specify which keys to read from storage
   */
  private async readFromStorage(config: StorageSyncConfig): Promise<any> {
    const outputs = config.getOutputs();

    if (outputs.length === 0) {
      throw new Error('No outputs configured');
    }

    // Read all keys specified in outputs
    const keys = outputs.map((output) => output.key);

    this.logger.info('Reading data from Chrome Storage', { keys });

    const storageData = await browser.storage.local.get(keys);

    // If multiple outputs, return as array or object
    // If single output, return the value directly
    if (outputs.length === 1) {
      const key = outputs[0].key;
      return storageData[key] !== undefined ? storageData[key] : outputs[0].defaultValue;
    }

    return storageData;
  }

  /**
   * Transform data if transformation config exists
   */
  private transformData(data: any, config: StorageSyncConfig): any {
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
   * Send data to adapter
   */
  // eslint-disable-next-line complexity -- Handles two adapter types (Notion/Spreadsheet) with different input requirements (databaseId vs spreadsheetId+range), different data handling (array vs 2D array), and validation logic for each. Splitting would reduce readability and cohesion.
  private async sendData(
    adapter: NotionSyncPort | SpreadsheetSyncPort,
    data: any,
    config: StorageSyncConfig
  ): Promise<number> {
    const inputs = config.getInputs();

    if ('createPage' in adapter) {
      // Notion adapter
      const databaseIdInput = inputs.find((input) => input.key === 'databaseId');
      if (!databaseIdInput || !databaseIdInput.value) {
        throw new Error('databaseId not found in inputs for Notion sync');
      }

      const databaseId = databaseIdInput.value as string;

      // If data is array, create multiple pages
      if (Array.isArray(data)) {
        let createdCount = 0;
        for (const item of data) {
          await adapter.createPage(databaseId, item);
          createdCount++;
        }
        this.logger.info(`Created ${createdCount} pages in Notion database`);
        return createdCount;
      } else {
        // Single item
        await adapter.createPage(databaseId, data);
        this.logger.info('Created 1 page in Notion database');
        return 1;
      }
    } else if ('writeSheetData' in adapter) {
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

      // Ensure data is 2D array for spreadsheet
      const sheetData = this.convertToSheetData(data);

      await adapter.writeSheetData(spreadsheetId, range, sheetData);

      const rowCount = sheetData.length;
      this.logger.info(`Wrote ${rowCount} rows to spreadsheet`);
      return rowCount;
    }

    throw new Error('Unsupported adapter type');
  }

  /**
   * Convert data to 2D array format for spreadsheet
   */
  private convertToSheetData(data: any): any[][] {
    if (Array.isArray(data)) {
      // If already 2D array, return as is
      if (data.length > 0 && Array.isArray(data[0])) {
        return data;
      }

      // If array of objects, convert to rows
      if (data.length > 0 && typeof data[0] === 'object') {
        // Extract keys from first object for header
        const keys = Object.keys(data[0]);
        const rows: any[][] = [keys]; // Header row

        // Convert each object to array
        for (const item of data) {
          const row = keys.map((key) => item[key]);
          rows.push(row);
        }

        return rows;
      }

      // Array of primitives, convert to single column
      return data.map((item) => [item]);
    }

    // Single object, convert to single row with header
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data);
      const values = keys.map((key) => data[key]);
      return [keys, values];
    }

    // Primitive value, single cell
    return [[data]];
  }
}
