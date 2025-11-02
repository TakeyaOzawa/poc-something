/**
 * Domain Service Interface: Data Mapper
 * Maps and extracts data from JSON using JSONPath expressions
 */

export interface MappingRule {
  /**
   * JSONPath expression to extract data
   * Examples:
   * - "$.data[*]" - Extract all items from data array
   * - "$.users[?(@.active==true)]" - Filter active users
   * - "$.items[*].name" - Extract all item names
   */
  sourcePath: string;

  /**
   * Target field name in the result
   * If null, the raw extracted data is returned without wrapping
   */
  targetField: string | null;
}

export interface DataMapper {
  /**
   * Extract data from JSON using a JSONPath expression
   *
   * @param jsonData JSON data as string or object
   * @param jsonPath JSONPath expression (e.g., "$.data[*]")
   * @returns Extracted data as array
   * @throws Error if JSONPath is invalid or extraction fails
   *
   * @example
   * const data = '{"users": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]}';
   * const result = mapper.extract(data, "$.users[*].name");
   * // Returns: ["Alice", "Bob"]
   */
  extract(jsonData: string | object, jsonPath: string): Promise<unknown[]>;

  /**
   * Apply multiple mapping rules to JSON data
   *
   * @param jsonData JSON data as string or object
   * @param rules Array of mapping rules to apply
   * @returns Object with mapped data
   * @throws Error if any rule fails
   *
   * @example
   * const data = '{"users": [{"id": 1, "name": "Alice"}], "total": 1}';
   * const rules = [
   *   { sourcePath: "$.users[*]", targetField: "items" },
   *   { sourcePath: "$.total", targetField: "count" }
   * ];
   * const result = mapper.map(data, rules);
   * // Returns: { items: [{id: 1, name: "Alice"}], count: 1 }
   */
  map(jsonData: string | object, rules: MappingRule[]): Promise<Record<string, unknown>>;

  /**
   * Validate if a JSONPath expression is valid
   *
   * @param jsonPath JSONPath expression to validate
   * @returns True if valid, false otherwise
   */
  isValidPath(jsonPath: string): boolean;
}
