/**
 * Domain Entity: Automation Variables
 * Represents automation variables and status for a specific website
 * Separated from Website entity for localStorage management
 */

import {
  AutomationStatus,
  isAutomationStatus,
} from '@domain/constants/AutomationStatus';
import { IdGenerator } from '@domain/types/id-generator.types';

export interface AutomationVariablesData {
  id: string;
  websiteId: string;
  variables: { [key: string]: string };
  status?: AutomationStatus;
  updatedAt: string; // ISO 8601
}

export class AutomationVariables {
  private data: AutomationVariablesData;

  constructor(data: AutomationVariablesData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: AutomationVariablesData): void {
    if (!data.id) throw new Error('ID is required');
    if (!data.websiteId) throw new Error('Website ID is required');
    if (data.status && !isAutomationStatus(data.status)) {
      throw new Error('Invalid status');
    }
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getWebsiteId(): string {
    return this.data.websiteId;
  }

  getVariables(): { [key: string]: string } {
    return { ...this.data.variables };
  }

  getStatus(): AutomationStatus | undefined {
    return this.data.status;
  }

  getUpdatedAt(): string {
    return this.data.updatedAt;
  }

  // Immutable setters
  setStatus(status: AutomationStatus): AutomationVariables {
    return new AutomationVariables({
      ...this.data,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  setVariable(name: string, value: string): AutomationVariables {
    const variables = { ...this.data.variables, [name]: value };
    return new AutomationVariables({
      ...this.data,
      variables,
      updatedAt: new Date().toISOString(),
    });
  }

  setVariables(variables: { [key: string]: string }): AutomationVariables {
    return new AutomationVariables({
      ...this.data,
      variables: { ...variables },
      updatedAt: new Date().toISOString(),
    });
  }

  removeVariable(name: string): AutomationVariables {
    const variables = { ...this.data.variables };
    delete variables[name];
    return new AutomationVariables({
      ...this.data,
      variables,
      updatedAt: new Date().toISOString(),
    });
  }

  clearVariables(): AutomationVariables {
    return new AutomationVariables({
      ...this.data,
      variables: {},
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Complete execution and apply status transition
   * Business Rule: ONCE status automatically becomes DISABLED after execution
   * This encapsulates the business logic for status transition within the domain entity
   * @returns New AutomationVariables instance with updated status (if applicable), or same instance if no change needed
   */
  completeExecution(): AutomationVariables {
    if (this.data.status === 'once') {
      return this.setStatus('disabled');
    }
    return this;
  }

  // Export data
  toData(): AutomationVariablesData {
    return { ...this.data };
  }

  // Clone
  clone(): AutomationVariables {
    return new AutomationVariables({ ...this.data });
  }

  // Static factory
  static create(
    params: {
      websiteId: string;
      variables?: { [key: string]: string };
      status?: AutomationStatus;
    },
    idGenerator: IdGenerator
  ): AutomationVariables {
    const data: AutomationVariablesData = {
      id: idGenerator.generate(),
      websiteId: params.websiteId,
      variables: params.variables || {},
      updatedAt: new Date().toISOString(),
    };

    if (params.status !== undefined) {
      data.status = params.status;
    }

    return new AutomationVariables(data);
  }

  // Create from existing data (for migration)
  static fromExisting(
    data: AutomationVariablesData,
    idGenerator?: IdGenerator
  ): AutomationVariables {
    return new AutomationVariables({
      ...data,
      id: data.id || (idGenerator ? idGenerator.generate() : `temp_${Date.now()}`), // Generate ID if missing
    });
  }
}
