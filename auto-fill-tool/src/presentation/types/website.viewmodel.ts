/**
 * Presentation Layer: Website View Model
 * UI-specific representation of website data
 */

export interface WebsiteViewModel {
  id: string;
  name: string;
  startUrl?: string;
  editable: boolean;
  updatedAt: string;
}

export interface AutomationVariablesViewModel {
  id: string;
  websiteId: string;
  variables: { [key: string]: string };
  status?: 'enabled' | 'disabled' | 'once';
  updatedAt: string;
}

export interface XPathViewModel {
  id: string;
  websiteId: string;
  value: string;
  actionType: string;
  afterWaitSeconds: number;
  actionPattern: number;
  pathAbsolute: string;
  pathShort: string;
  pathSmart: string;
  selectedPathPattern: string;
  retryType: number;
  executionOrder: number;
  executionTimeoutSeconds: number;
  url: string;
}
