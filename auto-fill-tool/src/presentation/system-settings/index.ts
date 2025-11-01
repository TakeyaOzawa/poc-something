/**
 * System Settings Manager Entry Point
 * システム設定画面のメインエントリーポイント
 */

import { SystemSettingsManagerPresenter } from './SystemSettingsManagerPresenter';
import { SystemSettingsManagerView } from './SystemSettingsManagerView';
import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@usecases/system-settings/ResetSystemSettingsUseCase';
import { ChromeStorageSystemSettingsRepository } from '@infrastructure/repositories/ChromeStorageSystemSettingsRepository';
import { SystemSettings } from '@domain/entities/SystemSettings';

// DI Container
const repository = new ChromeStorageSystemSettingsRepository();

const getSettingsUseCase = new GetSystemSettingsUseCase(repository);
const updateSettingsUseCase = new UpdateSystemSettingsUseCase(repository);
const resetSettingsUseCase = new ResetSystemSettingsUseCase(repository);

// View & Presenter
const view = new SystemSettingsManagerView();
const presenter = new SystemSettingsManagerPresenter(
  view,
  getSettingsUseCase,
  updateSettingsUseCase,
  resetSettingsUseCase
);

// グローバル関数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).saveSettings = async () => {
  const retryWaitSecondsMin = parseInt((document.getElementById('retryWaitSecondsMin') as HTMLInputElement).value);
  const retryWaitSecondsMax = parseInt((document.getElementById('retryWaitSecondsMax') as HTMLInputElement).value);
  const retryCount = parseInt((document.getElementById('retryCount') as HTMLInputElement).value);
  const recordingEnabled = (document.getElementById('recordingEnabled') as HTMLInputElement).checked;
  const recordingBitrate = parseFloat((document.getElementById('recordingBitrate') as HTMLInputElement).value);
  const recordingRetentionDays = parseInt((document.getElementById('recordingRetentionDays') as HTMLInputElement).value);

  const settings = SystemSettings.create({
    retryWaitSecondsMin,
    retryWaitSecondsMax,
    retryCount,
    recordingEnabled,
    recordingBitrate,
    recordingRetentionDays,
  });

  await presenter.updateSettings(settings);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).resetSettings = async () => {
  await presenter.resetSettings();
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  presenter.initialize();
});
