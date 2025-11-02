/**
 * Tests for NotionSyncPort
 */

import { NotionSyncAdapter } from '../NotionSyncAdapter';
import { SyncInput } from '@domain/entities/StorageSyncConfig';
import { Logger } from '@domain/types/logger.types';
import { Client } from '@notionhq/client';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock @notionhq/client
jest.mock('@notionhq/client');

// Mock Logger
const createMockLogger = (): jest.Mocked<Logger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  createChild: jest.fn(),
});

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('NotionSyncPort', () => {
  let adapter: NotionSyncAdapter;
  let mockLogger: jest.Mocked<Logger>;
  let mockClient: any; // Use 'any' type to avoid TypeScript conflicts with mock structure

  beforeEach(() => {
    mockLogger = createMockLogger();
    adapter = new NotionSyncAdapter(mockLogger);

    // Create mock client with jest.fn() for all methods
    mockClient = {
      users: {
        me: jest.fn(),
      },
      databases: {
        query: jest.fn(),
        retrieve: jest.fn(),
      },
      pages: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    // Mock Client constructor
    (Client as unknown).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('NotionSyncAdapter initialized');
    });

    it('should not be connected initially', () => {
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect successfully with valid API key', async () => {
      const inputs: SyncInput[] = [
        { key: 'apiKey', value: 'secret_valid_api_key' },
        { key: 'databaseId', value: 'db123' },
      ];

      mockClient.users.me.mockResolvedValue({} as unknown);

      const result = await adapter.connect(inputs);

      expect(result.isSuccess).toBe(true);
      expect(adapter.isConnected()).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Successfully connected to Notion API');
    });

    it('should return failure if API key not found in inputs', async () => {
      const inputs: SyncInput[] = [{ key: 'databaseId', value: 'db123' }];

      const result = await adapter.connect(inputs);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('API key not found in inputs');
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return failure if API key is empty', async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: '' }];

      const result = await adapter.connect(inputs);

      expect(result.isFailure).toBe(true);
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return failure if API key is not a string', async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 12345 }];

      const result = await adapter.connect(inputs);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toBe('Invalid API key format');
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return failure if connection test fails', async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_invalid_api_key' }];

      mockClient.users.me.mockRejectedValue(new Error('Unauthorized'));

      const result = await adapter.connect(inputs);

      expect(result.isFailure).toBe(true);
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('queryDatabase', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_valid_api_key' }];
      mockClient.users.me.mockResolvedValue({} as unknown);
      await adapter.connect(inputs);
    });

    it('should query database successfully', async () => {
      const databaseId = 'db123';
      const mockResponse = {
        results: [
          {
            id: 'page1',
            properties: { Name: { title: [{ plain_text: 'Page 1' }] } },
            created_time: '2024-01-01T00:00:00.000Z',
            last_edited_time: '2024-01-02T00:00:00.000Z',
          },
          {
            id: 'page2',
            properties: { Name: { title: [{ plain_text: 'Page 2' }] } },
            created_time: '2024-01-03T00:00:00.000Z',
            last_edited_time: '2024-01-04T00:00:00.000Z',
          },
        ],
      };

      mockClient.databases.query.mockResolvedValue(mockResponse as unknown);

      const result = await adapter.queryDatabase(databaseId);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value![0].id).toBe('page1');
      expect(result.value![1].id).toBe('page2');
      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: databaseId,
        filter: undefined,
      });
    });

    it('should query database with filter', async () => {
      const databaseId = 'db123';
      const filter = { property: 'Status', select: { equals: 'Active' } };
      const mockResponse = { results: [] };

      mockClient.databases.query.mockResolvedValue(mockResponse as unknown);

      const result = await adapter.queryDatabase(databaseId, filter);

      expect(result.isSuccess).toBe(true);
      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: databaseId,
        filter,
      });
    });

    it('should return failure when not connected', async () => {
      const newAdapter = new NotionSyncAdapter(mockLogger);

      const result = await newAdapter.queryDatabase('db123');

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Not connected to Notion API');
    });

    it('should return failure on API errors', async () => {
      const databaseId = 'db123';
      mockClient.databases.query.mockRejectedValue(new Error('Database not found'));

      const result = await adapter.queryDatabase(databaseId);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Database not found');
    });
  });

  describe('createPage', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_valid_api_key' }];
      mockClient.users.me.mockResolvedValue({} as unknown);
      await adapter.connect(inputs);
    });

    it('should create page successfully', async () => {
      const databaseId = 'db123';
      const properties = {
        Name: 'New Page',
        Status: 'Active',
      };
      const mockResponse = { id: 'page123' };

      mockClient.pages.create.mockResolvedValue(mockResponse as unknown);

      const result = await adapter.createPage(databaseId, properties);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('page123');
      expect(mockClient.pages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parent: { database_id: databaseId },
        })
      );
    });

    it('should handle different property types', async () => {
      const databaseId = 'db123';
      const properties = {
        Name: 'Test Page',
        Count: 42,
        Active: true,
      };
      const mockResponse = { id: 'page123' };

      mockClient.pages.create.mockResolvedValue(mockResponse as unknown);

      const result = await adapter.createPage(databaseId, properties);

      expect(result.isSuccess).toBe(true);
      expect(mockClient.pages.create).toHaveBeenCalled();
    });

    it('should return failure when not connected', async () => {
      const newAdapter = new NotionSyncAdapter(mockLogger);

      const result = await newAdapter.createPage('db123', {});

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Not connected to Notion API');
    });
  });

  describe('updatePage', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_valid_api_key' }];
      mockClient.users.me.mockResolvedValue({} as unknown);
      await adapter.connect(inputs);
    });

    it('should update page successfully', async () => {
      const pageId = 'page123';
      const properties = {
        Status: 'Completed',
      };

      mockClient.pages.update.mockResolvedValue({} as unknown);

      const result = await adapter.updatePage(pageId, properties);

      expect(result.isSuccess).toBe(true);
      expect(mockClient.pages.update).toHaveBeenCalledWith(
        expect.objectContaining({
          page_id: pageId,
        })
      );
    });

    it('should return failure when not connected', async () => {
      const newAdapter = new NotionSyncAdapter(mockLogger);

      const result = await newAdapter.updatePage('page123', {});

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Not connected to Notion API');
    });
  });

  describe('getDatabaseSchema', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_valid_api_key' }];
      mockClient.users.me.mockResolvedValue({} as unknown);
      await adapter.connect(inputs);
    });

    it('should retrieve database schema successfully', async () => {
      const databaseId = 'db123';
      const mockResponse = {
        id: databaseId,
        title: [{ plain_text: 'My Database' }],
        properties: {
          Name: { id: 'prop1', type: 'title' },
          Status: { id: 'prop2', type: 'select' },
          Count: { id: 'prop3', type: 'number' },
        },
      };

      mockClient.databases.retrieve.mockResolvedValue(mockResponse as unknown);

      const result = await adapter.getDatabaseSchema(databaseId);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.id).toBe(databaseId);
      expect(result.value!.title).toBe('My Database');
    });

    it('should return failure when not connected', async () => {
      const newAdapter = new NotionSyncAdapter(mockLogger);

      const result = await newAdapter.getDatabaseSchema('db123');

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Not connected to Notion API');
    });

    it('should handle database without title', async () => {
      const databaseId = 'db123';
      const mockResponse = {
        id: databaseId,
        title: [],
        properties: {},
      };

      mockClient.databases.retrieve.mockResolvedValue(mockResponse as unknown);

      const result = await adapter.getDatabaseSchema(databaseId);

      expect(result.isSuccess).toBe(true);
      expect(result.value!.title).toBe('Untitled');
    });
  });

  describe('testConnection', () => {
    it('should return success for successful connection', async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_valid_api_key' }];
      mockClient.users.me.mockResolvedValue({} as unknown);

      await adapter.connect(inputs);
      const result = await adapter.testConnection();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should return failure if client not initialized', async () => {
      const result = await adapter.testConnection();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Notion client not initialized');
    });

    it('should return failure for failed connection test', async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_valid_api_key' }];
      mockClient.users.me.mockResolvedValue({} as unknown);
      await adapter.connect(inputs);

      mockClient.users.me.mockRejectedValue(new Error('Unauthorized'));

      const result = await adapter.testConnection();

      expect(result.isFailure).toBe(true);
    });
  });

  describe('isConnected', () => {
    it('should return false initially', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return true after successful connection', async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_valid_api_key' }];
      mockClient.users.me.mockResolvedValue({} as unknown);

      await adapter.connect(inputs);

      expect(adapter.isConnected()).toBe(true);
    });

    it('should return false after failed connection', async () => {
      const inputs: SyncInput[] = [{ key: 'apiKey', value: 'secret_invalid_api_key' }];
      mockClient.users.me.mockRejectedValue(new Error('Unauthorized'));

      const result = await adapter.connect(inputs);

      expect(result.isFailure).toBe(true);
      expect(adapter.isConnected()).toBe(false);
    });
  });
});
