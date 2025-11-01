/**
 * Domain Entity: XPath
 */

export interface XPathData {
  id: string;
  websiteId: string;
  value: string;
  actionType: string;
  url: string;
  executionOrder: number;
}

export class XPath {
  private constructor(private data: XPathData) {}

  static create(data: XPathData): XPath {
    return new XPath(data);
  }

  getId(): string {
    return this.data.id;
  }

  getWebsiteId(): string {
    return this.data.websiteId;
  }

  getValue(): string {
    return this.data.value;
  }

  getActionType(): string {
    return this.data.actionType;
  }

  getUrl(): string {
    return this.data.url;
  }

  getExecutionOrder(): number {
    return this.data.executionOrder;
  }

  toData(): XPathData {
    return { ...this.data };
  }
}
