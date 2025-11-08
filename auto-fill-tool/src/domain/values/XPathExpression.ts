/**
 * Domain Value Object: XPath Expression
 * Represents a validated XPath expression with syntax validation
 */

/**
 * XPath Expression value object
 * Encapsulates XPath validation and utility methods
 */
export class XPathExpression {
  private readonly value: string;

  constructor(xpath: string) {
    this.value = this.validate(xpath);
  }

  /**
   * Validate XPath syntax
   */
  private validate(xpath: string): string {
    if (!xpath || xpath.trim().length === 0) {
      throw new Error('XPath expression cannot be empty');
    }

    const trimmed = xpath.trim();

    // Basic XPath syntax validation
    if (!trimmed.startsWith('/') && !trimmed.startsWith('./') && !trimmed.startsWith('//')) {
      throw new Error('XPath expression must start with /, ./, or //');
    }

    // Check for balanced brackets
    const openBrackets = (trimmed.match(/\[/g) || []).length;
    const closeBrackets = (trimmed.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      throw new Error('XPath expression has unbalanced brackets');
    }

    // Check for balanced parentheses
    const openParens = (trimmed.match(/\(/g) || []).length;
    const closeParens = (trimmed.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      throw new Error('XPath expression has unbalanced parentheses');
    }

    // Check for balanced quotes
    const singleQuotes = (trimmed.match(/'/g) || []).length;
    const doubleQuotes = (trimmed.match(/"/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      throw new Error('XPath expression has unbalanced single quotes');
    }
    if (doubleQuotes % 2 !== 0) {
      throw new Error('XPath expression has unbalanced double quotes');
    }

    return trimmed;
  }

  /**
   * Get the XPath value
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Check if XPath is absolute (starts with /)
   */
  public isAbsolute(): boolean {
    return this.value.startsWith('/') && !this.value.startsWith('//');
  }

  /**
   * Check if XPath is relative (starts with ./)
   */
  public isRelative(): boolean {
    return this.value.startsWith('./');
  }

  /**
   * Check if XPath uses descendant axis (starts with //)
   */
  public usesDescendantAxis(): boolean {
    return this.value.startsWith('//');
  }

  /**
   * Get XPath complexity score (simple heuristic)
   */
  public getComplexityScore(): number {
    let score = 0;

    // Count path segments
    score += (this.value.match(/\//g) || []).length;

    // Count predicates
    score += (this.value.match(/\[/g) || []).length * 2;

    // Count functions
    score += (this.value.match(/\w+\(/g) || []).length * 3;

    // Count axes
    score += (this.value.match(/::/g) || []).length * 2;

    return score;
  }

  /**
   * Check if XPath is considered simple (low complexity)
   */
  public isSimple(): boolean {
    return this.getComplexityScore() <= 5;
  }

  /**
   * Extract element tag names from XPath
   */
  public getElementTags(): string[] {
    const tags: string[] = [];
    const matches = this.value.match(/\/([a-zA-Z][a-zA-Z0-9-]*)/g);

    if (matches) {
      matches.forEach((match) => {
        const tag = match.substring(1); // Remove leading /
        if (tag && !tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }

    return tags;
  }

  /**
   * Check if XPath contains specific attribute
   */
  public containsAttribute(attributeName: string): boolean {
    const pattern = new RegExp(`@${attributeName}\\b`);
    return pattern.test(this.value);
  }

  /**
   * Equality comparison
   */
  public equals(other: XPathExpression): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Create from string (factory method)
   */
  public static from(xpath: string): XPathExpression {
    return new XPathExpression(xpath);
  }

  /**
   * Create a simple XPath by ID
   */
  public static byId(id: string): XPathExpression {
    if (!id || id.trim().length === 0) {
      throw new Error('ID cannot be empty');
    }
    return new XPathExpression(`//*[@id="${id.trim()}"]`);
  }

  /**
   * Create a simple XPath by class name
   */
  public static byClassName(className: string): XPathExpression {
    if (!className || className.trim().length === 0) {
      throw new Error('Class name cannot be empty');
    }
    return new XPathExpression(`//*[@class="${className.trim()}"]`);
  }

  /**
   * Create a simple XPath by tag name
   */
  public static byTagName(tagName: string): XPathExpression {
    if (!tagName || tagName.trim().length === 0) {
      throw new Error('Tag name cannot be empty');
    }
    return new XPathExpression(`//${tagName.trim()}`);
  }
}
