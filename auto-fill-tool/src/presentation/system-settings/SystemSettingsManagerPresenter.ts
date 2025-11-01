/**
 * SystemSettingsManagerPresenter
 * システム設定画面のPresenter
 */

import { SystemSettings } from '@domain/entities/SystemSettings';
import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@usecases/system-settings/ResetSystemSettingsUseCase';

export interface ISystemSettingsManagerView {
  showSettings(settings: SystemSettings): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  showLoading(isLoading: boolean): void;
}

export class SystemSettingsManagerPresenter {
  constructor(
    private view: ISystemSettingsManagerView,
    private getSettingsUseCase: GetSystemSettingsUseCase,
    private updateSettingsUseCase: UpdateSystemSettingsUseCase,
    private resetSettingsUseCase: ResetSystemSettingsUseCase
  ) {}

  async initialize(): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.loadSettings();
    } catch (error) {
      this.view.showError('初期化に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const settings = await this.getSettingsUseCase.execute();
      this.view.showSettings(settings);
    } catch (error) {
      this.view.showError('システム設定の読み込みに失敗しました');
    }
  }

  async updateSettings(settings: SystemSettings): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.updateSettingsUseCase.execute(settings);
      this.view.showSuccess('システム設定を更新しました');
      await this.loadSettings();
    } catch (error) {
      this.view.showError('システム設定の更新に失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }

  async resetSettings(): Promise<void> {
    try {
      this.view.showLoading(true);
      await this.resetSettingsUseCase.execute();
      this.view.showSuccess('システム設定をリセットしました');
      await this.loadSettings();
    } catch (error) {
      this.view.showError('システム設定のリセットに失敗しました');
    } finally {
      this.view.showLoading(false);
    }
  }
}
