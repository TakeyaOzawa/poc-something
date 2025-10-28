/**
 * Domain Port Interface: Spreadsheet Sync Port
 * Provides abstraction for Google Sheets API integration
 */

import { SyncInput } from '@domain/entities/StorageSyncConfig';
import { Result } from '@domain/values/result.value';

/**
 * Spreadsheet metadata
 */
export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: SheetInfo[];
}

/**
 * Sheet information
 */
export interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
}

/**
 * Spreadsheet Sync Port Interface
 */
export interface SpreadsheetSyncPort {
  /**
   * Connect to Google Sheets API using authentication information from inputs
   * @param inputs Array of input configurations containing access token or refresh token
   * @throws Error if tokens are not found or connection fails
   */
  connect(inputs: SyncInput[]): Promise<Result<void, Error>>;

  /**
   * Get data from a spreadsheet range
   * @param spreadsheetId Google Spreadsheet ID
   * @param range A1 notation range (e.g., "Sheet1!A1:D10")
   * @returns 2D array of cell values
   * @throws Error if retrieval fails
   */
  getSheetData(spreadsheetId: string, range: string): Promise<Result<any[][], Error>>;

  /**
   * Write data to a spreadsheet range
   * @param spreadsheetId Google Spreadsheet ID
   * @param range A1 notation range (e.g., "Sheet1!A1")
   * @param data 2D array of values to write
   * @throws Error if write fails
   */
  writeSheetData(spreadsheetId: string, range: string, data: any[][]): Promise<Result<void, Error>>;

  /**
   * Append data to the end of a sheet
   * @param spreadsheetId Google Spreadsheet ID
   * @param range A1 notation range specifying the sheet (e.g., "Sheet1!A:D")
   * @param data 2D array of values to append
   * @throws Error if append fails
   */
  appendSheetData(spreadsheetId: string, range: string, data: any[][]): Promise<Result<void, Error>>;

  /**
   * Get spreadsheet metadata (title, sheet names, dimensions)
   * @param spreadsheetId Google Spreadsheet ID
   * @returns Spreadsheet metadata
   * @throws Error if retrieval fails
   */
  getSpreadsheetMetadata(spreadsheetId: string): Promise<Result<SpreadsheetMetadata, Error>>;

  /**
   * Add a new sheet to the spreadsheet
   * @param spreadsheetId Google Spreadsheet ID
   * @param sheetTitle Title for the new sheet
   * @returns Sheet ID of the newly created sheet
   * @throws Error if creation fails
   */
  addSheet(spreadsheetId: string, sheetTitle: string): Promise<Result<number, Error>>;

  /**
   * Test connection to Google Sheets API
   * @returns True if connection is successful
   * @throws Error if connection test fails
   */
  testConnection(): Promise<Result<boolean, Error>>;

  /**
   * Check if adapter is connected
   * @returns True if connected to Google Sheets API
   */
  isConnected(): boolean;
}
