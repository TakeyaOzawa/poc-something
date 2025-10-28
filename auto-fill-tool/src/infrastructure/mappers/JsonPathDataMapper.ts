/**
 * Infrastructure Service: JSONPath Data Mapper
 * Implements data mapping using JSONPath expressions
 */

import { DataMapper, MappingRule } from '@domain/types/data-mapper.types';
import { Logger } from '@domain/types/logger.types';
import jp from 'jsonpath';

export class JsonPathDataMapper implements DataMapper {
  constructor(private logger: Logger) {}

  async extract(jsonData: string | object, jsonPath: string): Promise<any[]> {
    try {
      this.logger.debug(`Extracting data with JSONPath: ${jsonPath}`);

      // Parse JSON string if needed
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Execute JSONPath query
      const result = jp.query(data, jsonPath);

      this.logger.debug(`Extracted ${result.length} items`);

      return result;
    } catch (error) {
      this.logger.error(`JSONPath extraction failed: ${jsonPath}`, error);

      if (error instanceof Error) {
        throw new Error(`Failed to extract data with JSONPath "${jsonPath}": ${error.message}`);
      }

      throw new Error(`Failed to extract data with JSONPath "${jsonPath}"`);
    }
  }

  async map(jsonData: string | object, rules: MappingRule[]): Promise<Record<string, any>> {
    try {
      this.logger.debug(`Applying ${rules.length} mapping rules`);

      // Parse JSON string if needed
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      const result: Record<string, any> = {};

      for (const rule of rules) {
        try {
          const extracted = jp.query(data, rule.sourcePath);

          if (rule.targetField === null) {
            // If targetField is null, return the raw extracted data
            // This is useful for simple extractions
            this.logger.debug(`Extracted ${extracted.length} items (no target field)`);
            return extracted.length === 1 ? extracted[0] : extracted;
          }

          result[rule.targetField] = extracted.length === 1 ? extracted[0] : extracted;

          this.logger.debug(`Mapped ${extracted.length} items to field "${rule.targetField}"`);
        } catch (error) {
          this.logger.error(
            `Failed to apply mapping rule: ${rule.sourcePath} -> ${rule.targetField}`,
            error
          );
          throw new Error(
            `Failed to map data with rule "${rule.sourcePath}" -> "${rule.targetField}": ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      this.logger.debug(`Mapping completed with ${Object.keys(result).length} fields`);

      return result;
    } catch (error) {
      this.logger.error('Data mapping failed', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to map data');
    }
  }

  isValidPath(jsonPath: string): boolean {
    try {
      // Try to parse the JSONPath expression
      // jsonpath library will throw if the path is invalid
      jp.parse(jsonPath);
      return true;
    } catch (error) {
      this.logger.debug(`Invalid JSONPath: ${jsonPath}`);
      return false;
    }
  }
}
