/**
 * UUID Generator Factory
 * UUID生成のファクトリー実装
 */

import { IdGenerator } from '@domain/types/id-generator.types';

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}
