/**
 * Domain Entity: Website Configuration
 * Represents a website configuration for auto-fill operations
 * Note: variables and status have been moved to AutomationVariables entity
 */

export interface WebsiteData {
  id: string;
  name: string;
  updatedAt: string; // ISO 8601
  editable: boolean;
  startUrl?: string;
}

export class Website {
  private data: WebsiteData;

  constructor(data: WebsiteData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: WebsiteData): void {
    if (!data.id) throw new Error('Website ID is required');
    if (!data.name) throw new Error('Website name is required');
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getStartUrl(): string | undefined {
    return this.data.startUrl;
  }

  isEditable(): boolean {
    return this.data.editable;
  }

  // Immutable setters
  setStartUrl(url: string): Website {
    return new Website({
      ...this.data,
      startUrl: url,
      updatedAt: new Date().toISOString(),
    });
  }

  // Export data
  toData(): WebsiteData {
    return { ...this.data };
  }

  // Clone
  clone(): Website {
    return new Website({ ...this.data });
  }

  // Static factory
  static create(params: { name: string; editable?: boolean; startUrl?: string }): Website {
    return new Website({
      id: `website_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: params.name,
      editable: params.editable !== undefined ? params.editable : true,
      startUrl: params.startUrl || '',
      updatedAt: new Date().toISOString(),
    });
  }
}
