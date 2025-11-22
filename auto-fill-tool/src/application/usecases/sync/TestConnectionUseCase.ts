/**
 * Use Case: Test Connection
 * Tests connection to the configured sync endpoint using actual adapters
 */

import { StorageSyncConfig, SyncInput } from '@domain/entities/StorageSyncConfig';
import { NotionSyncPort } from '@domain/ports/NotionSyncPort';
import { SpreadsheetSyncPort } from '@domain/ports/SpreadsheetSyncPort';
import { Logger } from '@domain/types/logger.types';

export interface TestConnectionInput {
  config: StorageSyncConfig;
  /**
   * Timeout for connection test in milliseconds (default: 10000)
   */
  timeout?: number;
}

export interface TestConnectionOutput {
  success: boolean;
  isConnectable: boolean;
  responseTime?: number; // milliseconds
  statusCode?: number;
  error?: string;
}

export class TestConnectionUseCase {
  constructor(
    private notionAdapter: NotionSyncPort,
    private spreadsheetAdapter: SpreadsheetSyncPort,
    private logger: Logger
  ) {}

  async execute(input: TestConnectionInput): Promise<TestConnectionOutput> {
    try {
      const config = input.config;
      const syncMethod = config.getSyncMethod();
      const inputs = config.getInputs();

      this.logger.info(`Testing connection for config: ${config.getId()} (method: ${syncMethod})`);

      if (syncMethod === 'notion') {
        return await this.testNotionConnection(inputs);
      } else if (syncMethod === 'spread-sheet') {
        return await this.testSpreadsheetConnection(inputs);
      } else {
        this.logger.warn(`Unsupported sync method: ${syncMethod}`);
        return {
          success: true,
          isConnectable: false,
          error: `Unsupported sync method: ${syncMethod}`,
        };
      }
    } catch (error) {
      this.logger.error('Connection test failed', error);

      return {
        success: true,
        isConnectable: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  /**
   * Test Notion connection using NotionSyncPort
   */
  private async testNotionConnection(inputs: SyncInput[]): Promise<TestConnectionOutput> {
    const startTime = Date.now();

    try {
      this.logger.info('Testing Notion connection');

      // Connect to Notion API
      await this.notionAdapter.connect(inputs);

      // Test connection
      const connectionResult = await this.notionAdapter.testConnection();
      const responseTime = Date.now() - startTime;

      if (connectionResult.isFailure) {
        throw connectionResult.error!;
      }

      const isConnected = connectionResult.value ?? false;

      if (isConnected) {
        this.logger.info(`Notion connection test successful (${responseTime}ms)`);
      } else {
        this.logger.warn(`Notion connection test failed (${responseTime}ms)`);
      }

      return {
        success: true,
        isConnectable: isConnected,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Notion connection test failed';

      this.logger.error(`Notion connection test failed (${responseTime}ms)`, error);

      return {
        success: true,
        isConnectable: false,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Test Google Sheets connection using SpreadsheetSyncPort
   */
  private async testSpreadsheetConnection(inputs: SyncInput[]): Promise<TestConnectionOutput> {
    const startTime = Date.now();

    try {
      this.logger.info('Testing Google Sheets connection');

      // Connect to Google Sheets API
      await this.spreadsheetAdapter.connect(inputs);

      // Test connection
      const connectionResult = await this.spreadsheetAdapter.testConnection();
      const responseTime = Date.now() - startTime;

      if (connectionResult.isFailure) {
        throw connectionResult.error!;
      }

      const isConnected = connectionResult.value ?? false;

      if (isConnected) {
        this.logger.info(`Google Sheets connection test successful (${responseTime}ms)`);
      } else {
        this.logger.warn(`Google Sheets connection test failed (${responseTime}ms)`);
      }

      return {
        success: true,
        isConnectable: isConnected,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Google Sheets connection test failed';

      this.logger.error(`Google Sheets connection test failed (${responseTime}ms)`, error);

      return {
        success: true,
        isConnectable: false,
        responseTime,
        error: errorMessage,
      };
    }
  }
}
