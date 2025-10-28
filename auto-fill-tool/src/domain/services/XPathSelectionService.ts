/**
 * Domain Layer: XPath Selection Service
 * Manages XPath selection and execution order
 * Business Rules: XPath pattern selection, execution order sorting
 */

import { XPathData } from '@domain/entities/XPathCollection';
import { PATH_PATTERN, PathPattern } from '@domain/constants/PathPattern';

/**
 * XPath Selection Service
 * Encapsulates business rules for XPath selection
 *
 * Business Rules:
 * - smart: Recommended pattern with highest compatibility
 * - short: Shorter XPath for better performance
 * - absolute: Full path for maximum specificity
 * - Execution order determines step sequence
 */
export class XPathSelectionService {
  /**
   * Select XPath based on pattern
   * Business Rule: smart (default) > absolute > short priority
   *
   * @param xpath XPath data with multiple path variants
   * @returns Selected XPath string based on pattern
   */
  selectXPath(xpath: XPathData): string {
    switch (xpath.selectedPathPattern) {
      case PATH_PATTERN.SHORT:
        return xpath.pathShort;
      case PATH_PATTERN.ABSOLUTE:
        return xpath.pathAbsolute;
      case PATH_PATTERN.SMART:
      default:
        // Default to smart (highest compatibility)
        return xpath.pathSmart;
    }
  }

  /**
   * Sort XPath steps by execution order
   * Business Rule: Execute steps in ascending executionOrder
   *
   * @param xpaths Array of XPath data
   * @returns Sorted array (ascending by executionOrder)
   */
  sortByExecutionOrder(xpaths: XPathData[]): XPathData[] {
    return [...xpaths].sort((a, b) => a.executionOrder - b.executionOrder);
  }

  /**
   * Get pattern description for documentation/logging
   *
   * @param pattern Path pattern
   * @returns Human-readable description
   */
  getPatternDescription(pattern: PathPattern): string {
    switch (pattern) {
      case PATH_PATTERN.SMART:
        return 'Smart XPath - Recommended pattern with highest compatibility';
      case PATH_PATTERN.SHORT:
        return 'Short XPath - Shorter path for better performance';
      case PATH_PATTERN.ABSOLUTE:
        return 'Absolute XPath - Full path for maximum specificity';
      case PATH_PATTERN.NONE:
        return 'No XPath - Used for actions that do not require element selection';
      default:
        return 'Unknown pattern';
    }
  }

  /**
   * Validate execution order consistency
   * Business Rule: Execution orders should be unique within a website
   *
   * @param xpaths Array of XPath data
   * @returns true if all execution orders are unique
   */
  hasUniqueExecutionOrders(xpaths: XPathData[]): boolean {
    const orders = xpaths.map((x) => x.executionOrder);
    const uniqueOrders = new Set(orders);
    return orders.length === uniqueOrders.size;
  }

  /**
   * Find XPath by execution order
   *
   * @param xpaths Array of XPath data
   * @param executionOrder Target execution order
   * @returns XPath data if found, undefined otherwise
   */
  findByExecutionOrder(xpaths: XPathData[], executionOrder: number): XPathData | undefined {
    return xpaths.find((x) => x.executionOrder === executionOrder);
  }

  /**
   * Get next execution order value
   * Business Rule: Default increment is 100 to allow insertions
   *
   * @param xpaths Array of XPath data
   * @returns Next recommended execution order (max + 100)
   */
  getNextExecutionOrder(xpaths: XPathData[]): number {
    if (xpaths.length === 0) {
      return 100;
    }
    const maxOrder = Math.max(...xpaths.map((x) => x.executionOrder));
    return maxOrder + 100;
  }
}
