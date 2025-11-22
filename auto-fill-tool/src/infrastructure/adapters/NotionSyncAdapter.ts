/**
 * Infrastructure Layer: Notion Sync Adapter
 * Implements NotionSyncPort using @notionhq/client
 *
 * @coverage >=90%
 * @reason Notion API integration with authentication, CRUD operations, and error handling
 */

import { Client } from '@notionhq/client';
import {
  NotionSyncPort,
  NotionDatabaseSchema,
  NotionPageData,
  NotionFilter,
} from '@domain/ports/NotionSyncPort';
import { SyncInput } from '@domain/entities/StorageSyncConfig';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

export class NotionSyncAdapter implements NotionSyncPort {
  private client: Client | null = null;
  private connected: boolean = false;

  constructor(private logger: Logger) {
    this.logger.info('NotionSyncAdapter initialized');
  }

  /**
   * Connect to Notion API using API key from inputs
   */
  async connect(inputs: SyncInput[]): Promise<Result<void, Error>> {
    this.logger.info('Connecting to Notion API', {
      inputsCount: inputs.length,
    });

    try {
      // Extract API key from inputs
      const apiKeyInput = inputs.find((input) => input.key === 'apiKey');
      if (!apiKeyInput || !apiKeyInput.value) {
        return Result.failure(
          new Error('API key not found in inputs. Required input: { key: "apiKey", value: "..." }')
        );
      }

      const apiKey = apiKeyInput.value as string;

      // Validate API key format (basic check)
      if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        return Result.failure(new Error('Invalid API key format'));
      }

      // Create Notion client
      this.client = new Client({
        auth: apiKey,
      });

      // Test connection by listing users (minimal API call)
      const testResult = await this.testConnection();
      if (testResult.isFailure) {
        this.connected = false;
        this.client = null;
        return Result.failure(testResult.error!);
      }

      this.connected = true;
      this.logger.info('Successfully connected to Notion API');
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to connect to Notion API', error);
      this.connected = false;
      this.client = null;
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Query database and retrieve pages
   */
  async queryDatabase(
    databaseId: string,
    filter?: NotionFilter
  ): Promise<Result<NotionPageData[], Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Querying Notion database', {
      databaseId,
      hasFilter: !!filter,
    });

    try {
      // @ts-expect-error - Notion API types mismatch
      const response = await this.client!.databases.query({
        database_id: databaseId,
        filter: filter as Record<string, unknown>,
      });

      const pages = response.results.map((page: unknown) => this.convertToPageData(page));

      this.logger.info('Successfully queried Notion database', {
        databaseId,
        pageCount: pages.length,
      });

      return Result.success(pages);
    } catch (error) {
      this.logger.error('Failed to query Notion database', error, {
        databaseId,
      });
      return Result.failure(this.convertNotionError(error));
    }
  }

  /**
   * Create a new page in database
   */
  async createPage(
    databaseId: string,
    properties: Record<string, unknown>
  ): Promise<Result<string, Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Creating page in Notion database', {
      databaseId,
      propertyCount: Object.keys(properties).length,
    });

    try {
      const response = await this.client!.pages.create({
        parent: {
          database_id: databaseId,
        },
        properties: this.convertPropertiesToNotion(properties),
      });

      const pageId = response.id;

      this.logger.info('Successfully created page in Notion database', {
        databaseId,
        pageId,
      });

      return Result.success(pageId);
    } catch (error) {
      this.logger.error('Failed to create page in Notion database', error, {
        databaseId,
      });
      return Result.failure(this.convertNotionError(error));
    }
  }

  /**
   * Update existing page
   */
  async updatePage(
    pageId: string,
    properties: Record<string, unknown>
  ): Promise<Result<void, Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Updating Notion page', {
      pageId,
      propertyCount: Object.keys(properties).length,
    });

    try {
      await this.client!.pages.update({
        page_id: pageId,
        properties: this.convertPropertiesToNotion(properties),
      });

      this.logger.info('Successfully updated Notion page', {
        pageId,
      });

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to update Notion page', error, {
        pageId,
      });
      return Result.failure(this.convertNotionError(error));
    }
  }

  /**
   * Get database schema
   */
  async getDatabaseSchema(databaseId: string): Promise<Result<NotionDatabaseSchema, Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Retrieving Notion database schema', {
      databaseId,
    });

    try {
      const response = await this.client!.databases.retrieve({
        database_id: databaseId,
      });

      const schema: NotionDatabaseSchema = {
        id: response.id,
        title: this.extractDatabaseTitle(response),
        // @ts-expect-error - Notion API types mismatch
        properties: this.convertSchemaProperties(response.properties),
      };

      this.logger.info('Successfully retrieved Notion database schema', {
        databaseId,
        propertyCount: Object.keys(schema.properties).length,
      });

      return Result.success(schema);
    } catch (error) {
      this.logger.error('Failed to retrieve Notion database schema', error, {
        databaseId,
      });
      return Result.failure(this.convertNotionError(error));
    }
  }

  /**
   * Test connection to Notion API
   */
  async testConnection(): Promise<Result<boolean, Error>> {
    if (!this.client) {
      return Result.failure(new Error('Notion client not initialized. Call connect() first.'));
    }

    this.logger.info('Testing Notion API connection');

    try {
      // Simple API call to test connection
      await this.client.users.me({});

      this.logger.info('Notion API connection test successful');
      return Result.success(true);
    } catch (error) {
      this.logger.error('Notion API connection test failed', error);
      return Result.failure(this.convertNotionError(error));
    }
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  /**
   * Ensure client is connected before operations
   */
  private ensureConnected(): Result<void, Error> {
    if (!this.connected || !this.client) {
      return Result.failure(new Error('Not connected to Notion API. Call connect() first.'));
    }
    return Result.success(undefined);
  }

  /**
   * Convert Notion page object to NotionPageData
   */
  private convertToPageData(page: {
    id: string;
    properties: Record<string, unknown>;
    created_time: string;
    last_edited_time: string;
  }): NotionPageData {
    return {
      id: page.id,
      properties: page.properties,
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
    };
  }

  /**
   * Convert properties to Notion format
   */
  private convertPropertiesToNotion(properties: Record<string, unknown>): Record<string, unknown> {
    const notionProperties: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(properties)) {
      // Simple conversion - in production, this would need more sophisticated type handling
      if (typeof value === 'string') {
        notionProperties[key] = {
          rich_text: [
            {
              text: {
                content: value,
              },
            },
          ],
        };
      } else if (typeof value === 'number') {
        notionProperties[key] = {
          number: value,
        };
      } else if (typeof value === 'boolean') {
        notionProperties[key] = {
          checkbox: value,
        };
      } else {
        // For complex types, store as JSON string
        notionProperties[key] = {
          rich_text: [
            {
              text: {
                content: JSON.stringify(value),
              },
            },
          ],
        };
      }
    }

    return notionProperties;
  }

  /**
   * Convert database properties to schema format
   */
  private convertSchemaProperties(properties: Record<string, unknown>): Record<string, unknown> {
    const schema: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(properties)) {
      const prop = value as { id?: string; type?: string };
      schema[key] = {
        id: prop.id,
        name: key,
        type: prop.type,
      };
    }

    return schema;
  }

  /**
   * Extract database title from response
   */
  private extractDatabaseTitle(response: { title?: Array<{ plain_text?: string }> }): string {
    if (response.title && response.title.length > 0) {
      return response.title[0].plain_text || 'Untitled';
    }
    return 'Untitled';
  }

  /**
   * Convert Notion API error to standard Error
   */
  private convertNotionError(error: unknown): Error {
    if (error instanceof Error) {
      // Check if it's a Notion API error with code
      const notionError = error as Error & { code?: string };
      if (notionError.code) {
        return new Error(`Notion API Error (${notionError.code}): ${error.message}`);
      }
      return error;
    }
    return new Error(`Notion API Error: ${String(error)}`);
  }
}
