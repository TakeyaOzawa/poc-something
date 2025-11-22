/**
 * Domain Port: CSV Converter
 * Converts between CSV and JSON formats
 */

// Re-export from types for now to avoid breaking changes
export {
  CSVConverter,
  CSVParseOptions,
  CSVGenerateOptions,
  AutomationVariablesCSVConverter,
  WebsiteCSVConverter,
  XPathCSVConverter,
} from '@domain/types/csv-converter.types';

// Aliases for Port naming convention
export type CSVConverterPort = CSVConverter;
export type AutomationVariablesCSVConverterPort = AutomationVariablesCSVConverter;
export type WebsiteCSVConverterPort = WebsiteCSVConverter;
export type XPathCSVConverterPort = XPathCSVConverter;
