/**
 * Tests for SpreadsheetSyncPort
 */

import { SpreadsheetSyncAdapter } from '../SpreadsheetSyncAdapter';
import { Logger } from '@domain/types/logger.types';
import { SyncInput } from '@domain/entities/StorageSyncConfig';
import { google } from 'googleapis';

// Mock googleapis
jest.mock('googleapis');

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

describe('SpreadsheetSyncPort', () => {
  let adapter: SpreadsheetSyncAdapter;
  let mockLogger: jest.Mocked<Logger>;
  let mockAuth: any;
  let mockSheetsClient: any;

  beforeEach(() => {
    mockLogger = createMockLogger();

    // Mock OAuth2Client
    mockAuth = {
      setCredentials: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
    };

    // Mock Sheets client
    mockSheetsClient = {
      spreadsheets: {
        values: {
          get: jest.fn(),
          update: jest.fn(),
          append: jest.fn(),
        },
        get: jest.fn(),
        batchUpdate: jest.fn(),
      },
    };

    // Mock google.auth.OAuth2
    (google.auth.OAuth2 as any) = jest.fn().mockReturnValue(mockAuth);

    // Mock google.sheets
    (google.sheets as any) = jest.fn().mockReturnValue(mockSheetsClient);

    adapter = new SpreadsheetSyncAdapter(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('SpreadsheetSyncAdapter initialized');
    });
  });

  describe('connect', () => {
    it('should connect successfully with accessToken', async () => {
      const inputs: SyncInput[] = [
        { key: 'accessToken', value: 'test-access-token' },
        { key: 'clientId', value: 'test-client-id' },
        { key: 'clientSecret', value: 'test-client-secret' },
      ];

      await adapter.connect(inputs);

      expect(google.auth.OAuth2).toHaveBeenCalledWith('test-client-id', 'test-client-secret');
      expect(mockAuth.setCredentials).toHaveBeenCalledWith({
        access_token: 'test-access-token',
        refresh_token: undefined,
      });
      expect(google.sheets).toHaveBeenCalledWith({ version: 'v4', auth: mockAuth });
      expect(adapter.isConnected()).toBe(true);
    });

    it('should connect successfully with refreshToken', async () => {
      const inputs: SyncInput[] = [
        { key: 'refreshToken', value: 'test-refresh-token' },
        { key: 'clientId', value: 'test-client-id' },
        { key: 'clientSecret', value: 'test-client-secret' },
      ];

      await adapter.connect(inputs);

      expect(mockAuth.setCredentials).toHaveBeenCalledWith({
        access_token: undefined,
        refresh_token: 'test-refresh-token',
      });
      expect(adapter.isConnected()).toBe(true);
    });

    it('should throw error when no tokens provided', async () => {
      const inputs: SyncInput[] = [{ key: 'clientId', value: 'test-client-id' }];

      const result = await adapter.connect(inputs);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Access token or refresh token not found in inputs');
      expect(adapter.isConnected()).toBe(false);
    });

    it('should throw error when connection test fails', async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'invalid-token' }];

      mockAuth.getAccessToken.mockRejectedValue(new Error('Invalid token'));

      const result = await adapter.connect(inputs);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Invalid token');
      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('getSheetData', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'test-token' }];
      await adapter.connect(inputs);
    });

    it('should retrieve sheet data successfully', async () => {
      const mockData = [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ];
      mockSheetsClient.spreadsheets.values.get.mockResolvedValue({
        data: { values: mockData },
      });

      const result = await adapter.getSheetData('spreadsheet-id', 'Sheet1!A1:B2');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(mockData);
      expect(mockSheetsClient.spreadsheets.values.get).toHaveBeenCalledWith({
        spreadsheetId: 'spreadsheet-id',
        range: 'Sheet1!A1:B2',
      });
    });

    it('should return empty array when no data', async () => {
      mockSheetsClient.spreadsheets.values.get.mockResolvedValue({
        data: {},
      });

      const result = await adapter.getSheetData('spreadsheet-id', 'Sheet1!A1:B2');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should throw error when not connected', async () => {
      const disconnectedAdapter = new SpreadsheetSyncAdapter(mockLogger);

      const result = await disconnectedAdapter.getSheetData('spreadsheet-id', 'Sheet1!A1:B2');

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Not connected to Google Sheets API');
    });
  });

  describe('writeSheetData', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'test-token' }];
      await adapter.connect(inputs);
    });

    it('should write data to sheet successfully', async () => {
      const data = [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ];
      mockSheetsClient.spreadsheets.values.update.mockResolvedValue({});

      await adapter.writeSheetData('spreadsheet-id', 'Sheet1!A1', data);

      expect(mockSheetsClient.spreadsheets.values.update).toHaveBeenCalledWith({
        spreadsheetId: 'spreadsheet-id',
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });
    });
  });

  describe('appendSheetData', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'test-token' }];
      await adapter.connect(inputs);
    });

    it('should append data to sheet successfully', async () => {
      const data = [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ];
      mockSheetsClient.spreadsheets.values.append.mockResolvedValue({});

      await adapter.appendSheetData('spreadsheet-id', 'Sheet1!A:B', data);

      expect(mockSheetsClient.spreadsheets.values.append).toHaveBeenCalledWith({
        spreadsheetId: 'spreadsheet-id',
        range: 'Sheet1!A:B',
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });
    });
  });

  describe('getSpreadsheetMetadata', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'test-token' }];
      await adapter.connect(inputs);
    });

    it('should retrieve spreadsheet metadata successfully', async () => {
      mockSheetsClient.spreadsheets.get.mockResolvedValue({
        data: {
          spreadsheetId: 'test-id',
          properties: { title: 'Test Spreadsheet' },
          sheets: [
            {
              properties: {
                sheetId: 0,
                title: 'Sheet1',
                index: 0,
                gridProperties: {
                  rowCount: 100,
                  columnCount: 26,
                },
              },
            },
          ],
        },
      });

      const result = await adapter.getSpreadsheetMetadata('test-id');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual({
        spreadsheetId: 'test-id',
        title: 'Test Spreadsheet',
        sheets: [
          {
            sheetId: 0,
            title: 'Sheet1',
            index: 0,
            rowCount: 100,
            columnCount: 26,
          },
        ],
      });
    });
  });

  describe('addSheet', () => {
    beforeEach(async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'test-token' }];
      await adapter.connect(inputs);
    });

    it('should add a new sheet successfully', async () => {
      mockSheetsClient.spreadsheets.batchUpdate.mockResolvedValue({
        data: {
          replies: [
            {
              addSheet: {
                properties: {
                  sheetId: 123,
                },
              },
            },
          ],
        },
      });

      const result = await adapter.addSheet('spreadsheet-id', 'New Sheet');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(123);
      expect(mockSheetsClient.spreadsheets.batchUpdate).toHaveBeenCalledWith({
        spreadsheetId: 'spreadsheet-id',
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'New Sheet',
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is valid', async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'test-token' }];
      await adapter.connect(inputs);

      const result = await adapter.testConnection();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should throw error when not initialized', async () => {
      const result = await adapter.testConnection();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Sheets client not initialized');
    });
  });

  describe('isConnected', () => {
    it('should return false initially', () => {
      expect(adapter.isConnected()).toBe(false);
    });

    it('should return true after successful connection', async () => {
      const inputs: SyncInput[] = [{ key: 'accessToken', value: 'test-token' }];
      await adapter.connect(inputs);

      expect(adapter.isConnected()).toBe(true);
    });
  });
});
