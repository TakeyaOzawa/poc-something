/**
 * Domain Entity: XPath Collection
 * Represents a saved XPath with multiple formats
 */

import { ActionType as ActionTypeBase } from '@domain/constants/ActionType';
import { PathPattern as PathPatternBase } from '@domain/constants/PathPattern';
import { RetryType as RetryTypeBase } from '@domain/constants/RetryType';
import { ComparisonPattern as ComparisonPatternBase } from '@domain/constants/ComparisonPattern';
import { SelectPattern as SelectPatternBase } from '@domain/constants/SelectPattern';
import { EventPattern as EventPatternBase } from '@domain/constants/EventPattern';

export type ActionType = ActionTypeBase;
export type PathPattern = PathPatternBase;
export type RetryType = RetryTypeBase;
export type ComparisonPattern = ComparisonPatternBase;
export type SelectPattern = SelectPatternBase;
export type EventPattern = EventPatternBase;

/**
 * XPath Data with Action Pattern
 *
 * actionPattern usage depends on actionType:
 * - TYPE/CLICK/CHECK: EventPattern (10=Basic, 20=Framework-agnostic)
 * - JUDGE: ComparisonPattern (10=Equals, 20=NotEquals, 30=GreaterThan, 40=LessThan)
 * - SELECT_*: SelectPattern (10/110=Native, 20/120=Custom, 30/130=jQuery)
 * - CHANGE_URL: Not used
 */
export interface XPathData {
  id: string;
  websiteId: string; // ID of the website this XPath belongs to
  value: string;
  actionType: ActionType;
  afterWaitSeconds: number;
  actionPattern: number | EventPattern | ComparisonPattern | SelectPattern;
  pathAbsolute: string;
  pathShort: string;
  pathSmart: string;
  selectedPathPattern: PathPattern;
  retryType: RetryType;
  executionOrder: number;
  executionTimeoutSeconds: number;
  url: string;
}

export class XPathCollection {
  private readonly xpaths: ReadonlyMap<string, XPathData>;

  constructor(xpaths: XPathData[] = []) {
    this.xpaths = new Map(xpaths.map((xpath) => [xpath.id, Object.freeze(xpath)]));
  }

  add(xpath: Omit<XPathData, 'id'>): XPathCollection {
    const newXPath: XPathData = {
      ...xpath,
      id: this.generateId(),
    };
    const newXPaths = new Map(this.xpaths);
    newXPaths.set(newXPath.id, Object.freeze(newXPath));
    return new XPathCollection(Array.from(newXPaths.values()));
  }

  update(id: string, updates: Partial<Omit<XPathData, 'id'>>): XPathCollection {
    const existing = this.xpaths.get(id);
    if (!existing) {
      throw new Error(`XPath not found: ${id}`);
    }

    const updated: XPathData = {
      ...existing,
      ...updates,
    };
    const newXPaths = new Map(this.xpaths);
    newXPaths.set(id, Object.freeze(updated));
    return new XPathCollection(Array.from(newXPaths.values()));
  }

  delete(id: string): XPathCollection {
    if (!this.xpaths.has(id)) {
      throw new Error(`XPath not found: ${id}`);
    }
    const newXPaths = new Map(this.xpaths);
    newXPaths.delete(id);
    return new XPathCollection(Array.from(newXPaths.values()));
  }

  get(id: string): XPathData | undefined {
    return this.xpaths.get(id);
  }

  getAll(): XPathData[] {
    return Array.from(this.xpaths.values()).sort((a, b) => a.executionOrder - b.executionOrder);
  }

  getByWebsiteId(websiteId: string): XPathData[] {
    return Array.from(this.xpaths.values())
      .filter((xpath) => xpath.websiteId === websiteId)
      .sort((a, b) => a.executionOrder - b.executionOrder);
  }

  /**
   * Get the next execution order for a new XPath in the specified website
   * Returns the maximum execution order + 100, or 100 if no XPaths exist
   */
  getNextExecutionOrder(websiteId: string): number {
    const sameWebsiteXPaths = this.getByWebsiteId(websiteId);
    const maxOrder =
      sameWebsiteXPaths.length > 0
        ? Math.max(...sameWebsiteXPaths.map((x) => x.executionOrder))
        : 0;
    return maxOrder + 100;
  }

  /**
   * Add an XPath with a specific ID (for deserialization purposes)
   * This method is intended for use by Infrastructure layer mappers only
   */
  addWithId(xpath: XPathData): XPathCollection {
    const newXPaths = new Map(this.xpaths);
    newXPaths.set(xpath.id, Object.freeze(xpath));
    return new XPathCollection(Array.from(newXPaths.values()));
  }

  /**
   * Create an empty XPath collection
   */
  static empty(): XPathCollection {
    return new XPathCollection([]);
  }

  private generateId(): string {
    return `xpath_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}
