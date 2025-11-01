/**
 * Domain Entity: Data Transformer
 * Simplified version for basic data transformation
 */

export interface DataTransformerData {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export class DataTransformer {
  private constructor(private data: DataTransformerData) {}

  static create(data: DataTransformerData): DataTransformer {
    return new DataTransformer(data);
  }

  static fromData(data: DataTransformerData): DataTransformer {
    return new DataTransformer({ ...data });
  }

  toData(): DataTransformerData {
    return { ...this.data };
  }

  getId(): string {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  isEnabled(): boolean {
    return this.data.enabled;
  }
}
