/**
 * ChromeStorageSystemSettingsRepository
 * Chrome Storage APIを使用したシステム設定リポジトリの実装
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettings, SystemSettingsData } from '@domain/entities/SystemSettings';

export class ChromeStorageSystemSettingsRepository implements SystemSettingsRepository {
  private readonly STORAGE_KEY = 'SYSTEM_SETTINGS';

  async get(): Promise<SystemSettings> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY] as SystemSettingsData | undefined;
      return data ? SystemSettings.fromData(data) : SystemSettings.create();
    } catch (error) {
      console.error('Failed to get system settings:', error);
      return SystemSettings.create();
    }
  }

  async save(settings: SystemSettings): Promise<void> {
    try {
      const data = settings.toData();
      await chrome.storage.local.set({ [this.STORAGE_KEY]: data });
    } catch (error) {
      console.error('Failed to save system settings:', error);
      throw new Error('システム設定の保存に失敗しました');
    }
  }

  async reset(): Promise<void> {
    try {
      const defaultSettings = SystemSettings.create();
      await this.save(defaultSettings);
    } catch (error) {
      console.error('Failed to reset system settings:', error);
      throw new Error('システム設定のリセットに失敗しました');
    }
  }
}
