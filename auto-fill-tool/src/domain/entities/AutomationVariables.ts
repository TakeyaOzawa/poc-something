/**
 * AutomationVariables Entity
 * 自動化変数を管理するドメインエンティティ
 */

import { Variable, VariableData } from './Variable';

export interface AutomationVariablesData {
  id: string;
  websiteId: string;
  name: string;
  variables: VariableData[];
  createdAt: string;
  updatedAt: string;
}

export class AutomationVariables {
  private data: AutomationVariablesData;
  private variables: Variable[] = [];

  constructor(data: AutomationVariablesData) {
    this.data = { ...data };
    this.variables = data.variables.map(v => Variable.fromData(v));
  }

  static create(websiteId: string, name: string): AutomationVariables {
    const now = new Date().toISOString();
    return new AutomationVariables({
      id: 'av_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      websiteId,
      name,
      variables: [],
      createdAt: now,
      updatedAt: now
    });
  }

  static fromData(data: AutomationVariablesData): AutomationVariables {
    return new AutomationVariables(data);
  }

  getId(): string {
    return this.data.id;
  }

  getWebsiteId(): string {
    return this.data.websiteId;
  }

  getName(): string {
    return this.data.name;
  }

  getVariables(): Variable[] {
    return [...this.variables];
  }

  getCreatedAt(): string {
    return this.data.createdAt;
  }

  getUpdatedAt(): string {
    return this.data.updatedAt;
  }

  updateName(name: string): void {
    if (!name.trim()) {
      throw new Error('名前は必須です');
    }
    this.data.name = name.trim();
    this.updateTimestamp();
  }

  addVariable(variable: Variable): void {
    const existing = this.variables.find(v => v.getKey() === variable.getKey());
    if (existing) {
      throw new Error(`変数キー '${variable.getKey()}' は既に存在します`);
    }
    this.variables.push(variable);
    this.updateTimestamp();
  }

  updateVariable(key: string, value: string, description?: string): boolean {
    const variable = this.variables.find(v => v.getKey() === key);
    if (!variable) return false;
    
    variable.updateValue(value);
    variable.updateDescription(description);
    this.updateTimestamp();
    return true;
  }

  deleteVariable(key: string): boolean {
    const index = this.variables.findIndex(v => v.getKey() === key);
    if (index === -1) return false;
    
    this.variables.splice(index, 1);
    this.updateTimestamp();
    return true;
  }

  getVariableValue(key: string): string | undefined {
    const variable = this.variables.find(v => v.getKey() === key);
    return variable?.getValue();
  }

  hasVariable(key: string): boolean {
    return this.variables.some(v => v.getKey() === key);
  }

  toData(): AutomationVariablesData {
    return {
      ...this.data,
      variables: this.variables.map(v => v.toData())
    };
  }

  private updateTimestamp(): void {
    this.data.updatedAt = new Date().toISOString();
  }
}
