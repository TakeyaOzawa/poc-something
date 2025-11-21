/**
 * Infrastructure Layer: Spreadsheet Sync Adapter
 * Implements SpreadsheetSyncPort using googleapis
 *
 * @coverage >=90%
 * @reason Google Sheets API integration with authentication, CRUD operations, and error handling
 */

// Dynamic import type references for type safety
import type { sheets_v4 } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import {
  SpreadsheetSyncPort,
  SpreadsheetMetadata,
} from '@domain/types/spreadsheet-sync-port.types';
import { SyncInput } from '@domain/entities/StorageSyncConfig';
import { Logger } from '@domain/types/logger.types';
import { getInputValue } from '@domain/utils/SyncConfigUtils';
import { Result } from '@domain/values/result.value';

export class SpreadsheetSyncAdapter implements SpreadsheetSyncPort {
  private sheetsClient: sheets_v4.Sheets | null = null;
  private auth: OAuth2Client | null = null;
  private connected: boolean = false;

  constructor(private logger: Logger) {
    this.logger.info('SpreadsheetSyncAdapter initialized');
  }

  /**
   * Connect to Google Sheets API using OAuth2 tokens from inputs
   * Uses dynamic import to load googleapis only when needed (reduces bundle size)
   */
  async connect(inputs: SyncInput[]): Promise<Result<void, Error>> {
    this.logger.info('Connecting to Google Sheets API', {
      inputsCount: inputs.length,
    });

    try {
      // Extract OAuth2 tokens from inputs
      const accessToken = getInputValue<string>(inputs, 'accessToken');
      const refreshToken = getInputValue<string>(inputs, 'refreshToken');
      const clientId = getInputValue<string>(inputs, 'clientId');
      const clientSecret = getInputValue<string>(inputs, 'clientSecret');

      if (!accessToken && !refreshToken) {
        return Result.failure(
          new Error(
            'Access token or refresh token not found in inputs. Required inputs: { key: "accessToken", value: "..." } or { key: "refreshToken", value: "..." }'
          )
        );
      }

      // Dynamic import googleapis (only when connecting)
      // This reduces initial bundle size significantly (~10MB)
      this.logger.info('Loading googleapis library dynamically...');
      const { google } = await import('googleapis');
      this.logger.info('googleapis library loaded successfully');

      // Create OAuth2 client
      this.auth = new google.auth.OAuth2(clientId, clientSecret);

      // Set credentials
      const credentials: { access_token?: string; refresh_token?: string } = {};

      if (accessToken !== undefined) {
        credentials.access_token = accessToken;
      }

      if (refreshToken !== undefined) {
        credentials.refresh_token = refreshToken;
      }

      this.auth.setCredentials(credentials);

      // Create Sheets client
      this.sheetsClient = google.sheets({ version: 'v4', auth: this.auth });

      // Test connection
      const testResult = await this.testConnection();
      if (testResult.isFailure) {
        this.connected = false;
        this.sheetsClient = null;
        this.auth = null;
        return Result.failure(testResult.error!);
      }

      this.connected = true;
      this.logger.info('Successfully connected to Google Sheets API');
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to connect to Google Sheets API', error);
      this.connected = false;
      this.sheetsClient = null;
      this.auth = null;
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get data from spreadsheet range
   */
  async getSheetData(spreadsheetId: string, range: string): Promise<Result<unknown[][], Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Getting sheet data', {
      spreadsheetId,
      range,
    });

    try {
      const response = await this.sheetsClient!.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];

      this.logger.info('Successfully retrieved sheet data', {
        spreadsheetId,
        range,
        rowCount: values.length,
      });

      return Result.success(values);
    } catch (error) {
      this.logger.error('Failed to get sheet data', error, {
        spreadsheetId,
        range,
      });
      return Result.failure(this.convertGoogleError(error));
    }
  }

  /**
   * Write data to spreadsheet range
   */
  async writeSheetData(
    spreadsheetId: string,
    range: string,
    data: unknown[][]
  ): Promise<Result<void, Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Writing sheet data', {
      spreadsheetId,
      range,
      rowCount: data.length,
    });

    try {
      await this.sheetsClient!.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });

      this.logger.info('Successfully wrote sheet data', {
        spreadsheetId,
        range,
        rowCount: data.length,
      });

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to write sheet data', error, {
        spreadsheetId,
        range,
      });
      return Result.failure(this.convertGoogleError(error));
    }
  }

  /**
   * Append data to the end of a sheet
   */
  async appendSheetData(
    spreadsheetId: string,
    range: string,
    data: unknown[][]
  ): Promise<Result<void, Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Appending sheet data', {
      spreadsheetId,
      range,
      rowCount: data.length,
    });

    try {
      await this.sheetsClient!.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      });

      this.logger.info('Successfully appended sheet data', {
        spreadsheetId,
        range,
        rowCount: data.length,
      });

      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to append sheet data', error, {
        spreadsheetId,
        range,
      });
      return Result.failure(this.convertGoogleError(error));
    }
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheetMetadata(spreadsheetId: string): Promise<Result<SpreadsheetMetadata, Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Retrieving spreadsheet metadata', {
      spreadsheetId,
    });

    try {
      const response = await this.sheetsClient!.spreadsheets.get({
        spreadsheetId,
      });

      const metadata: SpreadsheetMetadata = {
        spreadsheetId: response.data.spreadsheetId || spreadsheetId,
        title: response.data.properties?.title || 'Untitled',
        sheets:
          response.data.sheets?.map((sheet) => ({
            sheetId: sheet.properties?.sheetId || 0,
            title: sheet.properties?.title || 'Untitled',
            index: sheet.properties?.index || 0,
            rowCount: sheet.properties?.gridProperties?.rowCount || 0,
            columnCount: sheet.properties?.gridProperties?.columnCount || 0,
          })) || [],
      };

      this.logger.info('Successfully retrieved spreadsheet metadata', {
        spreadsheetId,
        title: metadata.title,
        sheetCount: metadata.sheets.length,
      });

      return Result.success(metadata);
    } catch (error) {
      this.logger.error('Failed to retrieve spreadsheet metadata', error, {
        spreadsheetId,
      });
      return Result.failure(this.convertGoogleError(error));
    }
  }

  /**
   * Add a new sheet to the spreadsheet
   */
  async addSheet(spreadsheetId: string, sheetTitle: string): Promise<Result<number, Error>> {
    const connectionCheck = this.ensureConnected();
    if (connectionCheck.isFailure) {
      return Result.failure(connectionCheck.error!);
    }

    this.logger.info('Adding new sheet', {
      spreadsheetId,
      sheetTitle,
    });

    try {
      const response = await this.sheetsClient!.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                },
              },
            },
          ],
        },
      });

      const sheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId || 0;

      this.logger.info('Successfully added new sheet', {
        spreadsheetId,
        sheetTitle,
        sheetId,
      });

      return Result.success(sheetId);
    } catch (error) {
      this.logger.error('Failed to add new sheet', error, {
        spreadsheetId,
        sheetTitle,
      });
      return Result.failure(this.convertGoogleError(error));
    }
  }

  /**
   * Test connection to Google Sheets API
   */
  async testConnection(): Promise<Result<boolean, Error>> {
    if (!this.sheetsClient || !this.auth) {
      return Result.failure(new Error('Sheets client not initialized. Call connect() first.'));
    }

    this.logger.info('Testing Google Sheets API connection');

    try {
      // Test API access by listing spreadsheets (requires drive scope)
      // Since we may not have drive scope, we'll just verify auth is set up correctly
      const credentials = await this.auth.getAccessToken();

      if (!credentials.token) {
        return Result.failure(new Error('Failed to obtain access token'));
      }

      this.logger.info('Google Sheets API connection test successful');
      return Result.success(true);
    } catch (error) {
      this.logger.error('Google Sheets API connection test failed', error);
      return Result.failure(this.convertGoogleError(error));
    }
  }

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean {
    return this.connected && this.sheetsClient !== null && this.auth !== null;
  }

  /**
   * Ensure client is connected before operations
   */
  private ensureConnected(): Result<void, Error> {
    if (!this.connected || !this.sheetsClient || !this.auth) {
      return Result.failure(new Error('Not connected to Google Sheets API. Call connect() first.'));
    }
    return Result.success(undefined);
  }

  /**
   * Convert Google API error to standard Error
   */
  private convertGoogleError(error: unknown): Error {
    if (error instanceof Error) {
      // Check if it's a Google API error with response
      const googleError = error as Error & { code?: number; response?: { status?: number } };
      if (googleError.code || googleError.response) {
        const statusCode = googleError.code || googleError.response?.status;
        const message = googleError.message || 'Google API Error';
        return new Error(`Google Sheets API Error (${statusCode}): ${message}`);
      }
      return error;
    }
    return new Error(`Google Sheets API Error: ${String(error)}`);
  }
}
