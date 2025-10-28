/**
 * Domain Layer: System Settings Repository Interface
 */

import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';

export interface SystemSettingsRepository {
  save(collection: SystemSettingsCollection): Promise<Result<void, Error>>;
  load(): Promise<Result<SystemSettingsCollection, Error>>;
}
