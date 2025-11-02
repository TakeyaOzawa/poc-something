/**
 * Infrastructure Adapter: UUID ID Generator
 * Implements IdGenerator using uuid library
 */

import { v4 as uuidv4 } from 'uuid';
import { IdGenerator } from '@domain/types/id-generator.types';

export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return uuidv4();
  }
}
