/**
 * Domain Port Interface: Notion Sync Port
 * Provides abstraction for Notion API integration
 */

import { SyncInput } from '@domain/entities/StorageSyncConfig';
import { Result } from '@domain/values/result.value';

/**
 * Notion database schema
 */
export interface NotionDatabaseSchema {
  id: string;
  title: string;
  properties: Record<string, NotionPropertySchema>;
}

/**
 * Notion property schema
 */
export interface NotionPropertySchema {
  id: string;
  name: string;
  type: string;
}

/**
 * Notion page data
 */
export interface NotionPageData {
  id: string;
  properties: Record<string, any>;
  createdTime: string;
  lastEditedTime: string;
}

/**
 * Notion query filter
 */
export interface NotionFilter {
  [key: string]: any;
}

/**
 * Notion Sync Port Interface
 */
export interface NotionSyncPort {
  /**
   * Connect to Notion API using authentication information from inputs
   * @param inputs Array of input configurations containing API key
   * @throws Error if API key is not found or connection fails
   */
  connect(inputs: SyncInput[]): Promise<Result<void, Error>>;

  /**
   * Query database and retrieve pages
   * @param databaseId Notion database ID
   * @param filter Optional filter conditions
   * @returns Array of page data
   * @throws Error if query fails
   */
  queryDatabase(databaseId: string, filter?: NotionFilter): Promise<Result<NotionPageData[], Error>>;

  /**
   * Create a new page in database
   * @param databaseId Notion database ID
   * @param properties Page properties as key-value pairs
   * @returns Created page ID
   * @throws Error if creation fails
   */
  createPage(databaseId: string, properties: Record<string, any>): Promise<Result<string, Error>>;

  /**
   * Update existing page
   * @param pageId Notion page ID
   * @param properties Page properties to update
   * @throws Error if update fails
   */
  updatePage(pageId: string, properties: Record<string, any>): Promise<Result<void, Error>>;

  /**
   * Get database schema (structure and properties)
   * @param databaseId Notion database ID
   * @returns Database schema information
   * @throws Error if retrieval fails
   */
  getDatabaseSchema(databaseId: string): Promise<Result<NotionDatabaseSchema, Error>>;

  /**
   * Test connection to Notion API
   * @returns True if connection is successful
   * @throws Error if connection test fails
   */
  testConnection(): Promise<Result<boolean, Error>>;

  /**
   * Check if adapter is connected
   * @returns True if connected to Notion API
   */
  isConnected(): boolean;
}
