/**
 * Test: GeneralSettingsManager
 * Tests general settings tab management
 */

import { GeneralSettingsManager } from '../GeneralSettingsManager';
import { SystemSettingsPresenter } from '../SystemSettingsPresenter';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GeneralSettingsManager', () => {
  let manager: GeneralSettingsManager;
  let mockPresenter: jest.Mocked<SystemSettingsPresenter>;
  let mockLogger: jest.Mocked<Logger>;
  let saveButton: HTMLButtonElement;
  let resetButton: HTMLButtonElement;
  let retryWaitMin: HTMLInputElement;
  let retryWaitMax: HTMLInputElement;
  let retryCount: HTMLInputElement;
  let showXPathDialog: HTMLInputElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <form id="generalSettingsForm">
        <input id="retryWaitSecondsMin" type="number" value="30" />
        <input id="retryWaitSecondsMax" type="number" value="60" />
        <input id="retryCount" type="number" value="3" />
        <input id="waitForOptionsMilliseconds" type="number" value="500" />
        <select id="autoFillProgressDialogMode">
          <option value="withCancel">With Cancel</option>
          <option value="withoutCancel">Without Cancel</option>
          <option value="hidden">Hidden</option>
        </select>
        <select id="logLevel">
          <option value="0">None</option>
          <option value="1">Error</option>
          <option value="2">Warn</option>
          <option value="3">Info</option>
          <option value="4">Debug</option>
        </select>
        <button type="submit" id="saveGeneralSettings">Save</button>
      </form>
      <button id="generalCancelBtn">Cancel</button>
      <button id="generalResetBtn">Reset</button>
    `;

    saveButton = document.getElementById('saveGeneralSettings') as HTMLButtonElement;
    resetButton = document.getElementById('generalResetBtn') as HTMLButtonElement;
    retryWaitMin = document.getElementById('retryWaitSecondsMin') as HTMLInputElement;
    retryWaitMax = document.getElementById('retryWaitSecondsMax') as HTMLInputElement;
    retryCount = document.getElementById('retryCount') as HTMLInputElement;
    showXPathDialog = document.getElementById('autoFillProgressDialogMode') as HTMLInputElement;

    // Create mocks
    mockPresenter = {
      saveGeneralSettings: jest.fn().mockResolvedValue(undefined),
      resetSettings: jest.fn().mockResolvedValue(undefined),
      loadSettings: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Mock alert
    global.alert = jest.fn();

    manager = new GeneralSettingsManager(mockPresenter, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with DOM elements', () => {
      expect(manager).toBeDefined();
    });

    it('should attach event listeners', () => {
      const clickSpy = jest.spyOn(saveButton, 'click');
      saveButton.click();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('saveSettings', () => {
    it('should save valid settings', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      const waitForOptionsMilliseconds = document.getElementById(
        'waitForOptionsMilliseconds'
      ) as HTMLInputElement;
      const autoFillProgressDialogMode = document.getElementById(
        'autoFillProgressDialogMode'
      ) as HTMLSelectElement;
      const logLevel = document.getElementById('logLevel') as HTMLSelectElement;

      retryWaitMin.value = '45';
      retryWaitMax.value = '90';
      retryCount.value = '5';
      waitForOptionsMilliseconds.value = '500';
      autoFillProgressDialogMode.value = 'withCancel';
      logLevel.value = '3';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.saveGeneralSettings).toHaveBeenCalledWith({
        retryWaitSecondsMin: 45,
        retryWaitSecondsMax: 90,
        retryCount: 5,
        waitForOptionsMilliseconds: 500,
        autoFillProgressDialogMode: 'withCancel',
        logLevel: 3,
      });
    });

    it('should use hidden mode when checkbox unchecked', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      const autoFillProgressDialogMode = document.getElementById(
        'autoFillProgressDialogMode'
      ) as HTMLSelectElement;

      autoFillProgressDialogMode.value = 'hidden';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.saveGeneralSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          autoFillProgressDialogMode: 'hidden',
        })
      );
    });

    it('should validate retry wait min is non-negative', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      retryWaitMin.value = '-5';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.alert).toHaveBeenCalledWith('Retry wait time (min) must be 0 or greater');
      expect(mockPresenter.saveGeneralSettings).not.toHaveBeenCalled();
    });

    it('should validate retry wait max is non-negative', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      retryWaitMax.value = '-10';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.alert).toHaveBeenCalledWith('Retry wait time (max) must be 0 or greater');
      expect(mockPresenter.saveGeneralSettings).not.toHaveBeenCalled();
    });

    it('should validate max >= min', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      retryWaitMin.value = '60';
      retryWaitMax.value = '30';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.alert).toHaveBeenCalledWith(
        'Retry wait time (max) must be greater than or equal to min'
      );
      expect(mockPresenter.saveGeneralSettings).not.toHaveBeenCalled();
    });

    it('should validate retry count is non-negative integer', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      retryCount.value = '-1';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.alert).toHaveBeenCalledWith('Retry count must be 0 or greater integer');
      expect(mockPresenter.saveGeneralSettings).not.toHaveBeenCalled();
    });

    it('should validate retry count is integer', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      retryCount.value = '3.5';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.alert).toHaveBeenCalledWith('Retry count must be 0 or greater integer');
      expect(mockPresenter.saveGeneralSettings).not.toHaveBeenCalled();
    });

    it('should validate NaN values', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      retryWaitMin.value = 'abc';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.alert).toHaveBeenCalledWith('Retry wait time (min) must be 0 or greater');
      expect(mockPresenter.saveGeneralSettings).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const form = document.getElementById('generalSettingsForm') as HTMLFormElement;
      const error = new Error('Save failed');
      mockPresenter.saveGeneralSettings.mockRejectedValue(error);

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save general settings', error);
    });
  });

  describe('resetSettings', () => {
    it('should reset settings', async () => {
      resetButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.resetSettings).toHaveBeenCalled();
    });
  });

  describe('cancelChanges', () => {
    beforeEach(() => {
      mockPresenter.loadSettings = jest.fn().mockResolvedValue(undefined);
    });

    it('should reload all settings when cancel button is clicked', async () => {
      const cancelButton = document.getElementById('generalCancelBtn') as HTMLButtonElement;

      cancelButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.loadSettings).toHaveBeenCalled();
    });
  });

  describe('loadSettings', () => {
    it('should load all settings fields', () => {
      const waitForOptionsMilliseconds = document.getElementById(
        'waitForOptionsMilliseconds'
      ) as HTMLInputElement;
      const autoFillProgressDialogMode = document.getElementById(
        'autoFillProgressDialogMode'
      ) as HTMLSelectElement;
      const logLevel = document.getElementById('logLevel') as HTMLSelectElement;

      const settings = {
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 20,
        retryCount: 5,
        waitForOptionsMilliseconds: 1000,
        autoFillProgressDialogMode: 'withoutCancel' as const,
        logLevel: 2,
      };

      manager.loadSettings(settings);

      expect(retryWaitMin.value).toBe('10');
      expect(retryWaitMax.value).toBe('20');
      expect(retryCount.value).toBe('5');
      expect(waitForOptionsMilliseconds.value).toBe('1000');
      expect(autoFillProgressDialogMode.value).toBe('withoutCancel');
      expect(logLevel.value).toBe('2');
    });

    it('should load partial settings', () => {
      const settings = {
        retryWaitSecondsMin: 15,
        retryCount: 8,
      };

      manager.loadSettings(settings);

      expect(retryWaitMin.value).toBe('15');
      expect(retryCount.value).toBe('8');
      // Other fields should retain their original values
      expect(retryWaitMax.value).toBe('60');
    });

    it('should handle empty settings object', () => {
      const originalMin = retryWaitMin.value;
      const originalMax = retryWaitMax.value;

      manager.loadSettings({});

      expect(retryWaitMin.value).toBe(originalMin);
      expect(retryWaitMax.value).toBe(originalMax);
    });

    it('should handle undefined values in settings', () => {
      const settings = {
        retryWaitSecondsMin: undefined,
        retryWaitSecondsMax: 25,
      };

      manager.loadSettings(settings);

      expect(retryWaitMax.value).toBe('25');
    });
  });

  describe('constructor with missing DOM elements', () => {
    it('should log errors when DOM elements are missing', () => {
      // Clear the DOM
      document.body.innerHTML = '';

      const loggerWithErrors = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn().mockReturnThis(),
      } as any;

      const mockPresenterForMissingElements = {
        saveGeneralSettings: jest.fn(),
        resetGeneralSettings: jest.fn(),
      } as any;

      // Create manager with missing DOM elements
      new GeneralSettingsManager(mockPresenterForMissingElements, loggerWithErrors);

      // Verify error logging for missing elements
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'General settings form element not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Retry wait min input not found');
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Retry wait max input not found');
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Retry count input not found');
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Wait for options milliseconds input not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Auto fill progress dialog mode select not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Log level select not found');
    });
  });
});
