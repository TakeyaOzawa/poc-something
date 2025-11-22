/**
 * Domain Entity: Website Configuration
 * Represents a website configuration for auto-fill operations
 * Note: variables and status have been moved to AutomationVariables entity
 */

import { AggregateRoot } from './AggregateRoot';
import { WebsiteId } from '@domain/values/WebsiteId';
import { WebsiteUrl } from '@domain/values/WebsiteUrl';

export interface WebsiteData {
  id: string;
  name: string;
  updatedAt: string; // ISO 8601
  editable: boolean;
  startUrl?: string;
}

export class Website extends AggregateRoot<WebsiteId> {
  private readonly id: WebsiteId;
  private readonly name: string;
  private readonly updatedAt: Date;
  private readonly editable: boolean;
  private readonly startUrl: WebsiteUrl | undefined;

  constructor(data: WebsiteData) {
    super();
    this.validate(data);
    this.id = WebsiteId.from(data.id);
    this.name = data.name;
    this.updatedAt = new Date(data.updatedAt);
    this.editable = data.editable;
    this.startUrl = data.startUrl ? WebsiteUrl.fromOptional(data.startUrl) : undefined;
  }

  private validate(data: WebsiteData): void {
    if (!data.id) throw new Error('Website ID is required');
    if (!data.name || data.name.trim().length === 0) throw new Error('Website name is required');
    if (!data.updatedAt) throw new Error('Updated date is required');
  }

  // Getters with Value Objects
  getId(): WebsiteId {
    return this.id;
  }

  getIdValue(): string {
    return this.id.getValue();
  }

  getName(): string {
    return this.name;
  }

  getStartUrl(): WebsiteUrl | undefined {
    return this.startUrl;
  }

  getStartUrlValue(): string | undefined {
    return this.startUrl?.getValue();
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  isEditable(): boolean {
    return this.editable;
  }

  // Business methods using Value Objects
  hasSecureStartUrl(): boolean {
    return this.startUrl?.isSecure() ?? false;
  }

  getStartUrlDomain(): string | undefined {
    return this.startUrl?.getDomain();
  }

  matchesUrl(url: string): boolean {
    if (!this.startUrl) return false;
    try {
      const targetUrl = WebsiteUrl.from(url);
      return this.startUrl.getDomain() === targetUrl.getDomain();
    } catch {
      return false;
    }
  }

  // Immutable setters
  setStartUrl(url: string): Website {
    const websiteUrl = WebsiteUrl.from(url);
    const data: WebsiteData = {
      id: this.id.getValue(),
      name: this.name,
      editable: this.editable,
      updatedAt: new Date().toISOString(),
    };
    if (websiteUrl) {
      data.startUrl = websiteUrl.getValue();
    }
    return new Website(data);
  }

  setName(name: string): Website {
    if (!name || name.trim().length === 0) {
      throw new Error('Website name cannot be empty');
    }
    const data: WebsiteData = {
      id: this.id.getValue(),
      name: name.trim(),
      editable: this.editable,
      updatedAt: new Date().toISOString(),
    };
    if (this.startUrl) {
      data.startUrl = this.startUrl.getValue();
    }
    return new Website(data);
  }

  // Export data (for persistence)
  toData(): WebsiteData {
    const data: WebsiteData = {
      id: this.id.getValue(),
      name: this.name,
      editable: this.editable,
      updatedAt: this.updatedAt.toISOString(),
    };
    if (this.startUrl) {
      data.startUrl = this.startUrl.getValue();
    }
    return data;
  }

  // Clone
  clone(): Website {
    return new Website(this.toData());
  }

  // Equality
  equals(other: Website): boolean {
    return this.id.equals(other.id);
  }

  // Static factory methods
  static create(params: { name: string; editable?: boolean; startUrl?: string }): Website {
    const id = WebsiteId.generate();
    const data: WebsiteData = {
      id: id.getValue(),
      name: params.name.trim(),
      editable: params.editable !== undefined ? params.editable : true,
      updatedAt: new Date().toISOString(),
    };

    if (params.startUrl) {
      // Validate URL by creating WebsiteUrl
      const websiteUrl = WebsiteUrl.from(params.startUrl);
      data.startUrl = websiteUrl.getValue();
    }

    return new Website(data);
  }

  static fromName(name: string): Website {
    const id = WebsiteId.fromName(name);
    return new Website({
      id: id.getValue(),
      name: name.trim(),
      editable: true,
      updatedAt: new Date().toISOString(),
    });
  }
}
