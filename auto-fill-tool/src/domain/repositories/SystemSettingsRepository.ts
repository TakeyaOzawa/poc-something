/**
 * SystemSettingsRepository Interface
 * システム設定の永続化を抽象化するリポジトリインターフェース
 */

import { SystemSettings } from '@domain/entities/SystemSettings';

export interface SystemSettingsRepository {
  get(): Promise<SystemSettings>;
  save(settings: SystemSettings): Promise<void>;
  reset(): Promise<void>;
}
