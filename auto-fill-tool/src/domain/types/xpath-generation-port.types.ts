/**
 * Domain Layer: XPath Generation Port Interface
 * Defines the contract for generating various types of XPath expressions
 *
 * Implementation note: Actual implementation should be in infrastructure layer
 * as it depends on browser DOM APIs.
 */

export interface XPathResult {
  smart: string | null;
  short: string | null;
  absolute: string | null;
}

export interface XPathGenerationPort {
  /**
   * Generate all three XPath variants at once
   */
  generateAll(element: unknown): XPathResult;

  /**
   * Generate mixed XPath (uses ID when available)
   */
  getMixed(element: unknown): string | null;

  /**
   * Generate absolute XPath (from root, no IDs)
   */
  getAbsolute(element: unknown): string | null;

  /**
   * Generate smart XPath (uses attributes like id, class, text)
   */
  getSmart(element: unknown): string | null;
}
