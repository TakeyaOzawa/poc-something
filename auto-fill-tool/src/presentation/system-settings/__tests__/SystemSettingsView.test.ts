/**
 * Test: SystemSettingsView
 * Tests DOM rendering and updates for system settings
 */

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => key),
    format: jest.fn((key: string, ...args: string[]) => `${key}: ${args.join(', ')}`),
    applyToDOM: jest.fn(),
  },
}));

import { SystemSettingsViewImpl } from '../SystemSettingsView';
import { SystemSettingsViewModel } from '@presentation/types/SystemSettingsViewModel';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SystemSettingsViewImpl', () => {
  let view: SystemSettingsViewImpl;
  let mockStatusMessage: HTMLDivElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="statusMessage"></div>
      <input id="retryWaitSecondsMin" type="number" />
      <input id="retryWaitSecondsMax" type="number" />
      <input id="retryCount" type="number" />
      <input id="showXPathDialogDuringAutoFill" type="checkbox" />
      <input id="enableAudioRecording" type="checkbox" />
      <input id="gradientStartColor" type="color" />
      <input id="gradientEndColor" type="color" />
      <input id="gradientAngle" type="range" min="0" max="360" value="135" />
      <span id="gradientAngleValue">135°</span>
    `;

    mockStatusMessage = document.getElementById('statusMessage') as HTMLDivElement;
    view = new SystemSettingsViewImpl();

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('showSuccess', () => {
    it('should display success message', () => {
      view.showSuccess('Operation successful');

      expect(mockStatusMessage.textContent).toBe('Operation successful');
      expect(mockStatusMessage.className).toContain('success');
      expect(mockStatusMessage.style.display).toBe('block');
    });

    it('should auto-hide after 3 seconds', () => {
      view.showSuccess('Success');

      jest.advanceTimersByTime(3000);

      expect(mockStatusMessage.style.display).toBe('none');
    });
  });

  describe('showError', () => {
    it('should display error message', () => {
      view.showError('Error occurred');

      expect(mockStatusMessage.textContent).toBe('Error occurred');
      expect(mockStatusMessage.className).toContain('error');
      expect(mockStatusMessage.style.display).toBe('block');
    });

    it('should auto-hide after 3 seconds', () => {
      view.showError('Error');

      jest.advanceTimersByTime(3000);

      expect(mockStatusMessage.style.display).toBe('none');
    });

    it('should fallback to alert when statusMessage element is not found', () => {
      // Remove statusMessage from DOM
      document.body.innerHTML = '';
      view = new SystemSettingsViewImpl();

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      view.showError('Error message');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SystemSettingsView] Status message element not found'
      );
      expect(alertSpy).toHaveBeenCalledWith('Error message');

      alertSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('showLoading', () => {
    it('should display loading message', () => {
      view.showLoading();

      expect(mockStatusMessage.className).toContain('loading');
      expect(mockStatusMessage.style.display).toBe('block');
    });

    it('should warn when statusMessage element is missing', () => {
      document.body.innerHTML = '';
      view = new SystemSettingsViewImpl();

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      view.showLoading();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SystemSettingsView] Status message element not found'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('hideLoading', () => {
    it('should hide loading message after delay', () => {
      mockStatusMessage.classList.add('loading');
      mockStatusMessage.style.display = 'block';

      view.hideLoading();
      jest.advanceTimersByTime(300);

      expect(mockStatusMessage.style.display).toBe('none');
    });

    it('should not hide if not loading', () => {
      mockStatusMessage.classList.add('success');
      mockStatusMessage.style.display = 'block';

      view.hideLoading();
      jest.advanceTimersByTime(300);

      expect(mockStatusMessage.style.display).toBe('block');
    });

    it('should handle hideLoading when statusMessage is null', () => {
      document.body.innerHTML = '';
      view = new SystemSettingsViewImpl();

      // Should not throw error
      expect(() => view.hideLoading()).not.toThrow();
    });
  });

  describe('updateGeneralSettings', () => {
    it('should update all general settings inputs', () => {
      const settings: SystemSettingsViewModel = {
        retryWaitSecondsMin: 45,
        retryWaitSecondsMax: 90,
        retryCount: 5,
        autoFillProgressDialogMode: 'withCancel',
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
        retryWaitRangeText: '45-90s',
        retryCountText: '5',
        recordingStatusText: 'Enabled',
        logSettingsText: 'All sources',
        canSave: true,
        canReset: true,
        canExport: true,
        canImport: true,
      };

      view.updateGeneralSettings(settings);

      const retryWaitMin = document.getElementById('retryWaitSecondsMin') as HTMLInputElement;
      const retryWaitMax = document.getElementById('retryWaitSecondsMax') as HTMLInputElement;
      const retryCount = document.getElementById('retryCount') as HTMLInputElement;
      const showXPathDialog = document.getElementById(
        'showXPathDialogDuringAutoFill'
      ) as HTMLInputElement;

      expect(retryWaitMin.value).toBe('45');
      expect(retryWaitMax.value).toBe('90');
      expect(retryCount.value).toBe('5');
      expect(showXPathDialog.checked).toBe(true);
    });

    it('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = '<div id="statusMessage"></div>';
      view = new SystemSettingsViewImpl();

      const settings: SystemSettingsViewModel = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
        retryWaitRangeText: '30-60s',
        retryCountText: '3',
        recordingStatusText: 'Enabled',
        logSettingsText: 'All sources',
        canSave: true,
        canReset: true,
        canExport: true,
        canImport: true,
      };

      expect(() => view.updateGeneralSettings(settings)).not.toThrow();
    });

    it('should set checkbox to false when dialog mode is hidden', () => {
      const settings: SystemSettingsViewModel = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        autoFillProgressDialogMode: 'hidden',
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
        retryWaitRangeText: '30-60s',
        retryCountText: '3',
        recordingStatusText: 'Enabled',
        logSettingsText: 'All sources',
        canSave: true,
        canReset: true,
        canExport: true,
        canImport: true,
      };

      view.updateGeneralSettings(settings);

      const showXPathDialog = document.getElementById(
        'showXPathDialogDuringAutoFill'
      ) as HTMLInputElement;
      expect(showXPathDialog.checked).toBe(false);
    });
  });

  describe('updateRecordingSettings', () => {
    it('should update recording settings', () => {
      const settings = new SystemSettingsCollection({
        enableAudioRecording: true,
      });

      view.updateRecordingSettings(settings);

      const enableAudioRecording = document.getElementById(
        'enableAudioRecording'
      ) as HTMLInputElement;
      expect(enableAudioRecording.checked).toBe(false);
    });

    it('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = '<div id="statusMessage"></div>';
      view = new SystemSettingsViewImpl();

      const settings = new SystemSettingsCollection();

      expect(() => view.updateRecordingSettings(settings)).not.toThrow();
    });
  });

  describe('updateAppearanceSettings', () => {
    it('should update all appearance settings', () => {
      const settings = new SystemSettingsCollection({
        gradientStartColor: '#ff0000',
        gradientEndColor: '#00ff00',
        gradientAngle: 180,
      });

      view.updateAppearanceSettings(settings);

      const startColor = document.getElementById('gradientStartColor') as HTMLInputElement;
      const endColor = document.getElementById('gradientEndColor') as HTMLInputElement;
      const angle = document.getElementById('gradientAngle') as HTMLInputElement;
      const angleValue = document.getElementById('gradientAngleValue') as HTMLSpanElement;

      expect(startColor.value).toBe('#4f46e5');
      expect(endColor.value).toBe('#7c3aed');
      expect(angle.value).toBe('135');
      expect(angleValue.textContent).toBe('135°');
    });

    it('should handle missing DOM elements gracefully', () => {
      document.body.innerHTML = '<div id="statusMessage"></div>';
      view = new SystemSettingsViewImpl();

      const settings = new SystemSettingsCollection();

      expect(() => view.updateAppearanceSettings(settings)).not.toThrow();
    });
  });

  describe('applyGradientBackground', () => {
    it('should apply gradient to body background', () => {
      const backgroundSpy = jest.spyOn(document.body.style, 'background', 'set');

      view.applyGradientBackground('#667eea', '#764ba2', 135);

      expect(backgroundSpy).toHaveBeenCalled();
    });

    it('should work with different angles', () => {
      const backgroundSpy = jest.spyOn(document.body.style, 'background', 'set');

      view.applyGradientBackground('#000000', '#ffffff', 90);

      expect(backgroundSpy).toHaveBeenCalled();
    });
  });
});
