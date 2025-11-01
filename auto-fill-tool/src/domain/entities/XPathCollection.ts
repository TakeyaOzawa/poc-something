/**
 * XPathCollection Entity
 * XPath設定のコレクションを管理するドメインエンティティ
 */

export interface XPathData {
  id: string;
  websiteId: string;
  url: string;
  actionType: string;
  value: string;
  executionOrder: number;
  shortXPath: string | undefined;
  absoluteXPath: string | undefined;
  smartXPath: string | undefined;
  selectedPathPattern: string;
  afterWaitSeconds: number | undefined;
  executionTimeoutSeconds: number | undefined;
  retryType: number;
  actionPattern: string | undefined;
}

export class XPathCollection {
  private xpaths: XPathData[] = [];

  constructor(xpaths: XPathData[] = []) {
    this.xpaths = [...xpaths];
  }

  static create(): XPathCollection {
    return new XPathCollection();
  }

  static fromData(data: XPathData[]): XPathCollection {
    return new XPathCollection(data);
  }

  add(xpath: XPathData): void {
    if (!xpath.id) {
      xpath.id = this.generateId();
    }
    this.xpaths.push(xpath);
  }

  update(id: string, updates: Partial<XPathData>): boolean {
    const index = this.xpaths.findIndex(x => x.id === id);
    if (index === -1) return false;
    
    // 必須フィールドが存在することを確認してから更新
    const current = this.xpaths[index];
    if (!current) return false;
    
    const updated: XPathData = {
      id: current.id,
      websiteId: updates.websiteId ?? current.websiteId,
      url: updates.url ?? current.url,
      actionType: updates.actionType ?? current.actionType,
      value: updates.value ?? current.value,
      executionOrder: updates.executionOrder ?? current.executionOrder,
      selectedPathPattern: updates.selectedPathPattern ?? current.selectedPathPattern,
      retryType: updates.retryType ?? current.retryType,
      shortXPath: updates.shortXPath ?? current.shortXPath,
      absoluteXPath: updates.absoluteXPath ?? current.absoluteXPath,
      smartXPath: updates.smartXPath ?? current.smartXPath,
      afterWaitSeconds: updates.afterWaitSeconds ?? current.afterWaitSeconds,
      executionTimeoutSeconds: updates.executionTimeoutSeconds ?? current.executionTimeoutSeconds,
      actionPattern: updates.actionPattern ?? current.actionPattern,
    };
    
    this.xpaths[index] = updated;
    return true;
  }

  delete(id: string): boolean {
    const index = this.xpaths.findIndex(x => x.id === id);
    if (index === -1) return false;
    
    this.xpaths.splice(index, 1);
    return true;
  }

  getById(id: string): XPathData | undefined {
    return this.xpaths.find(x => x.id === id);
  }

  getByWebsiteId(websiteId: string): XPathData[] {
    return this.xpaths.filter(x => x.websiteId === websiteId);
  }

  getAll(): XPathData[] {
    return [...this.xpaths];
  }

  clear(): void {
    this.xpaths = [];
  }

  size(): number {
    return this.xpaths.length;
  }

  toData(): XPathData[] {
    return this.getAll();
  }

  private generateId(): string {
    return 'xpath_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }
}
