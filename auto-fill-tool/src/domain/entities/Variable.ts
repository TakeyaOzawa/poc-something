/**
 * Variable Entity
 * 変数を管理するドメインエンティティ
 */

export interface VariableData {
  key: string;
  value: string;
  description: string | undefined;
}

export class Variable {
  private data: VariableData;

  constructor(key: string, value: string, description?: string) {
    if (!key.trim()) {
      throw new Error('変数キーは必須です');
    }
    
    this.data = {
      key: key.trim(),
      value: value,
      description: description?.trim() || undefined
    };
  }

  static create(key: string, value: string, description?: string): Variable {
    return new Variable(key, value, description);
  }

  static fromData(data: VariableData): Variable {
    return new Variable(data.key, data.value, data.description);
  }

  getKey(): string {
    return this.data.key;
  }

  getValue(): string {
    return this.data.value;
  }

  getDescription(): string | undefined {
    return this.data.description;
  }

  updateValue(value: string): void {
    this.data.value = value;
  }

  updateDescription(description: string | undefined): void {
    this.data.description = description?.trim() || undefined;
  }

  toData(): VariableData {
    return { ...this.data };
  }

  equals(other: Variable): boolean {
    return this.data.key === other.data.key;
  }
}
