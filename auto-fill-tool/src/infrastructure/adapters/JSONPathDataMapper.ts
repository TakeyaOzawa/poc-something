/**
 * Infrastructure Layer: JSONPath Data Mapper
 * Implements DataMapper interface using jsonpath-plus library
 *
 * @coverage >=90%
 * @reason Data mapping implementation with JSONPath expression evaluation
 */

import { JSONPath } from 'jsonpath-plus';
import { DataMapper, MappingRule } from '@domain/types/data-mapper.types';
import { Logger } from '@domain/types/logger.types';

export class JSONPathDataMapper implements DataMapper {
  constructor(private logger: Logger) {
    this.logger.info('JSONPathDataMapper initialized');
  }

  /**
   * Extract data from JSON using a JSONPath expression
   */
  async extract(jsonData: string | object, jsonPath: string): Promise<any[]> {
    this.logger.debug('Extracting data with JSONPath', {
      jsonPath,
      dataType: typeof jsonData,
    });

    try {
      // Parse JSON string if needed
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Validate JSONPath expression
      if (!this.isValidPath(jsonPath)) {
        throw new Error(`Invalid JSONPath expression: ${jsonPath}`);
      }

      // Extract data using JSONPath
      const result = JSONPath({
        path: jsonPath,
        json: data,
        wrap: true, // Always return array
      });

      this.logger.debug('Data extracted successfully', {
        jsonPath,
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to extract data with JSONPath', error, {
        jsonPath,
        dataType: typeof jsonData,
      });

      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON data: ${error.message}`);
      }

      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Apply multiple mapping rules to JSON data
   */
  async map(jsonData: string | object, rules: MappingRule[]): Promise<Record<string, any>> {
    this.logger.debug('Applying mapping rules', {
      rulesCount: rules.length,
      dataType: typeof jsonData,
    });

    try {
      // Parse JSON string if needed
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      const result: Record<string, any> = {};

      // Apply each mapping rule
      for (const rule of rules) {
        this.logger.debug('Applying mapping rule', {
          sourcePath: rule.sourcePath,
          targetField: rule.targetField,
        });

        const extracted = await this.extract(data, rule.sourcePath);

        // If targetField is null, return raw extracted data
        // If only one item extracted and targetField is specified, unwrap the array
        if (rule.targetField === null) {
          return extracted.length === 1 ? extracted[0] : extracted;
        }

        // Store extracted data with target field name
        result[rule.targetField] = extracted.length === 1 ? extracted[0] : extracted;
      }

      this.logger.debug('Mapping rules applied successfully', {
        rulesCount: rules.length,
        resultKeys: Object.keys(result),
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to apply mapping rules', error, {
        rulesCount: rules.length,
        dataType: typeof jsonData,
      });

      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON data: ${error.message}`);
      }

      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Validate if a JSONPath expression is valid
   */
  isValidPath(jsonPath: string): boolean {
    try {
      // Basic validation: JSONPath should start with $ or @
      if (!jsonPath || (!jsonPath.startsWith('$') && !jsonPath.startsWith('@'))) {
        this.logger.debug('Invalid JSONPath: must start with $ or @', { jsonPath });
        return false;
      }

      // Try to parse the expression with a dummy object
      JSONPath({
        path: jsonPath,
        json: {},
        wrap: false,
      });

      this.logger.debug('JSONPath is valid', { jsonPath });
      return true;
    } catch (error) {
      this.logger.debug('Invalid JSONPath expression', {
        jsonPath,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
