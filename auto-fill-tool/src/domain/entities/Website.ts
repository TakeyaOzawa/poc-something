/**
 * Domain Entity: Website
 */

export interface WebsiteData {
  id: string;
  name: string;
  startUrl: string;
  status: 'enabled' | 'disabled' | 'once';
}

export class Website {
  private constructor(private data: WebsiteData) {}

  static create(name: string, startUrl: string, status: 'enabled' | 'disabled' | 'once'): Website;
  static create(data: WebsiteData): Website;
  static create(nameOrData: string | WebsiteData, startUrl?: string, status?: 'enabled' | 'disabled' | 'once'): Website {
    if (typeof nameOrData === 'string') {
      const data: WebsiteData = {
        id: Math.random().toString(36).substr(2, 9),
        name: nameOrData,
        startUrl: startUrl!,
        status: status!
      };
      return new Website(data);
    }
    return new Website(nameOrData);
  }

  static fromData(data: WebsiteData): Website {
    return new Website(data);
  }

  getId(): string {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getStartUrl(): string {
    return this.data.startUrl;
  }

  getStatus(): string {
    return this.data.status;
  }

  isEnabled(): boolean {
    return this.data.status === 'enabled';
  }

  updateName(name: string): void {
    this.data.name = name;
  }

  updateStartUrl(startUrl: string): void {
    this.data.startUrl = startUrl;
  }

  updateStatus(status: 'enabled' | 'disabled' | 'once'): void {
    this.data.status = status;
  }

  update(data: Partial<WebsiteData>): void {
    if (data.name !== undefined) this.data.name = data.name;
    if (data.startUrl !== undefined) this.data.startUrl = data.startUrl;
    if (data.status !== undefined) this.data.status = data.status;
  }

  toData(): WebsiteData {
    return { ...this.data };
  }
}
