/**
 * Test: AppearanceSettingsManager
 * Tests appearance settings tab management with gradient system
 */

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => key),
    format: jest.fn((key: string, ...args: string[]) => `${key}: ${args.join(', ')}`),
    applyToDOM: jest.fn(),
  },
}));

import { AppearanceSettingsManager } from '../AppearanceSettingsManager';
import { SystemSettingsPresenter } from '../SystemSettingsPresenter';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('AppearanceSettingsManager', () => {
  let manager: AppearanceSettingsManager;
  let mockPresenter: jest.Mocked<SystemSettingsPresenter>;
  let mockLogger: jest.Mocked<Logger>;
  let saveButton: HTMLButtonElement;
  let resetButton: HTMLButtonElement;
  let gradientStartColor: HTMLInputElement;
  let gradientEndColor: HTMLInputElement;
  let gradientAngle: HTMLInputElement;
  let gradientAngleValue: HTMLSpanElement;
  let gradientPreview: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <form id="appearanceSettingsForm">
        <input id="gradientStartColor" type="color" />
        <input id="gradientStartColorText" type="text" />
        <input id="gradientEndColor" type="color" />
        <input id="gradientEndColorText" type="text" />
        <input id="gradientAngle" type="range" min="0" max="360" />
        <span id="gradientAngleDisplay"></span>
        <button type="submit" id="saveAppearanceSettings">Save</button>
      </form>
      <button id="appearanceCancelBtn">Cancel</button>
      <button id="appearanceResetBtn">Reset</button>
    `;

    saveButton = document.getElementById('saveAppearanceSettings') as HTMLButtonElement;
    resetButton = document.getElementById('appearanceResetBtn') as HTMLButtonElement;
    gradientStartColor = document.getElementById('gradientStartColor') as HTMLInputElement;
    gradientEndColor = document.getElementById('gradientEndColor') as HTMLInputElement;
    gradientAngle = document.getElementById('gradientAngle') as HTMLInputElement;
    gradientAngleValue = document.getElementById('gradientAngleDisplay') as HTMLSpanElement;
    gradientPreview = document.body; // Use body as preview since that's where gradient is applied

    // Set initial values
    gradientStartColor.value = '#667eea';
    gradientEndColor.value = '#764ba2';
    gradientAngle.value = '135';
    gradientAngleValue.textContent = '135°';

    // Create mocks
    mockPresenter = {
      saveAppearanceSettings: jest.fn().mockResolvedValue(undefined),
      resetAppearanceSettings: jest.fn().mockResolvedValue(undefined),
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

    manager = new AppearanceSettingsManager(mockPresenter, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with DOM elements', () => {
      expect(manager).toBeDefined();
    });

    it('should attach save and reset event listeners', () => {
      const clickSpy = jest.spyOn(saveButton, 'click');
      saveButton.click();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should attach live preview event listeners', () => {
      const inputEvent = new Event('input');
      gradientStartColor.dispatchEvent(inputEvent);

      expect(gradientAngleValue.textContent).toBe('135°');
    });
  });

  describe('updateLivePreview', () => {
    it('should update angle display on input', () => {
      gradientAngle.value = '90';
      const inputEvent = new Event('input');
      gradientAngle.dispatchEvent(inputEvent);

      expect(gradientAngleValue.textContent).toBe('90°');
    });

    it('should apply gradient to preview box', () => {
      const backgroundSpy = jest.spyOn(gradientPreview.style, 'background', 'set');

      gradientStartColor.value = '#ff0000';
      gradientEndColor.value = '#00ff00';
      gradientAngle.value = '180';

      const inputEvent = new Event('input');
      gradientAngle.dispatchEvent(inputEvent);

      expect(backgroundSpy).toHaveBeenCalled();
    });

    it('should apply gradient to body background', () => {
      const backgroundSpy = jest.spyOn(document.body.style, 'background', 'set');

      gradientStartColor.value = '#ff0000';
      gradientEndColor.value = '#00ff00';
      gradientAngle.value = '45';

      const inputEvent = new Event('input');
      gradientAngle.dispatchEvent(inputEvent);

      expect(backgroundSpy).toHaveBeenCalled();
    });

    it('should update on start color change', () => {
      const backgroundSpy = jest.spyOn(document.body.style, 'background', 'set');

      gradientStartColor.value = '#123456';
      const inputEvent = new Event('input');
      gradientStartColor.dispatchEvent(inputEvent);

      expect(backgroundSpy).toHaveBeenCalled();
    });

    it('should update on end color change', () => {
      const backgroundSpy = jest.spyOn(document.body.style, 'background', 'set');

      gradientEndColor.value = '#abcdef';
      const inputEvent = new Event('input');
      gradientEndColor.dispatchEvent(inputEvent);

      expect(backgroundSpy).toHaveBeenCalled();
    });
  });

  describe('saveSettings', () => {
    it('should save appearance settings', async () => {
      const form = document.getElementById('appearanceSettingsForm') as HTMLFormElement;
      gradientStartColor.value = '#112233';
      gradientEndColor.value = '#445566';
      gradientAngle.value = '270';

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.saveAppearanceSettings).toHaveBeenCalledWith({
        gradientStartColor: '#112233',
        gradientEndColor: '#445566',
        gradientAngle: 270,
      });
    });

    it('should handle save errors gracefully', async () => {
      const form = document.getElementById('appearanceSettingsForm') as HTMLFormElement;
      const error = new Error('Save failed');
      mockPresenter.saveAppearanceSettings.mockRejectedValue(error);

      form.dispatchEvent(new Event('submit'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save appearance settings', error);
    });
  });

  describe('resetSettings', () => {
    it('should reset appearance settings', async () => {
      resetButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.resetSettings).toHaveBeenCalled();
    });
  });

  describe('cancelChanges', () => {
    beforeEach(() => {
      mockPresenter.loadAllSettings = jest.fn().mockResolvedValue(undefined);
    });

    it('should reload all settings when cancel button is clicked', async () => {
      const cancelButton = document.getElementById('appearanceCancelBtn') as HTMLButtonElement;

      cancelButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.loadSettings).toHaveBeenCalled();
    });
  });

  describe('color input sync', () => {
    it('should sync start color picker with text input', () => {
      const startColorText = document.getElementById('gradientStartColorText') as HTMLInputElement;
      gradientStartColor.value = '#aabbcc';

      const inputEvent = new Event('input');
      gradientStartColor.dispatchEvent(inputEvent);

      expect(startColorText.value).toBe('#aabbcc');
    });

    it('should sync start text input with color picker for valid hex', () => {
      const startColorText = document.getElementById('gradientStartColorText') as HTMLInputElement;
      startColorText.value = '#ddeeff';

      const inputEvent = new Event('input');
      startColorText.dispatchEvent(inputEvent);

      expect(gradientStartColor.value).toBe('#ddeeff');
    });

    it('should not sync start text input with color picker for invalid hex', () => {
      const startColorText = document.getElementById('gradientStartColorText') as HTMLInputElement;
      const originalValue = gradientStartColor.value;
      startColorText.value = '#zzz';

      const inputEvent = new Event('input');
      startColorText.dispatchEvent(inputEvent);

      expect(gradientStartColor.value).toBe(originalValue);
    });

    it('should sync end color picker with text input', () => {
      const endColorText = document.getElementById('gradientEndColorText') as HTMLInputElement;
      gradientEndColor.value = '#112233';

      const inputEvent = new Event('input');
      gradientEndColor.dispatchEvent(inputEvent);

      expect(endColorText.value).toBe('#112233');
    });

    it('should sync end text input with color picker for valid hex', () => {
      const endColorText = document.getElementById('gradientEndColorText') as HTMLInputElement;
      endColorText.value = '#445566';

      const inputEvent = new Event('input');
      endColorText.dispatchEvent(inputEvent);

      expect(gradientEndColor.value).toBe('#445566');
    });

    it('should not sync end text input with color picker for invalid hex', () => {
      const endColorText = document.getElementById('gradientEndColorText') as HTMLInputElement;
      const originalValue = gradientEndColor.value;
      endColorText.value = 'invalid';

      const inputEvent = new Event('input');
      endColorText.dispatchEvent(inputEvent);

      expect(gradientEndColor.value).toBe(originalValue);
    });
  });

  describe('loadSettings', () => {
    it('should load all appearance settings fields', () => {
      const startColorText = document.getElementById('gradientStartColorText') as HTMLInputElement;
      const endColorText = document.getElementById('gradientEndColorText') as HTMLInputElement;

      const settings = {
        gradientStartColor: '#ff0000',
        gradientEndColor: '#00ff00',
        gradientAngle: 90,
      };

      manager.loadSettings(settings);

      expect(gradientStartColor.value).toBe('#ff0000');
      expect(startColorText.value).toBe('#ff0000');
      expect(gradientEndColor.value).toBe('#00ff00');
      expect(endColorText.value).toBe('#00ff00');
      expect(gradientAngle.value).toBe('90');
      expect(gradientAngleValue.textContent).toBe('90°');
    });

    it('should load partial settings', () => {
      const settings = {
        gradientStartColor: '#123456',
      };

      const originalAngle = gradientAngle.value;

      manager.loadSettings(settings);

      expect(gradientStartColor.value).toBe('#123456');
      expect(gradientAngle.value).toBe(originalAngle);
    });

    it('should handle empty settings object', () => {
      const originalStart = gradientStartColor.value;
      const originalEnd = gradientEndColor.value;
      const originalAngle = gradientAngle.value;

      manager.loadSettings({});

      expect(gradientStartColor.value).toBe(originalStart);
      expect(gradientEndColor.value).toBe(originalEnd);
      expect(gradientAngle.value).toBe(originalAngle);
    });

    it('should handle undefined values in settings', () => {
      const originalStart = gradientStartColor.value;

      const settings = {
        gradientStartColor: undefined,
        gradientEndColor: '#abcdef',
      };

      manager.loadSettings(settings);

      expect(gradientStartColor.value).toBe(originalStart);
      expect(gradientEndColor.value).toBe('#abcdef');
    });

    it('should update live preview after loading settings', () => {
      const backgroundSpy = jest.spyOn(document.body.style, 'background', 'set');

      const settings = {
        gradientStartColor: '#ff00ff',
        gradientEndColor: '#00ffff',
        gradientAngle: 45,
      };

      manager.loadSettings(settings);

      expect(backgroundSpy).toHaveBeenCalled();
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
        saveAppearanceSettings: jest.fn(),
        resetAppearanceSettings: jest.fn(),
      } as any;

      // Create manager with missing DOM elements
      new AppearanceSettingsManager(mockPresenterForMissingElements, loggerWithErrors);

      // Verify error logging for missing elements
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Appearance settings form element not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Gradient start color input not found');
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Gradient start color text input not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Gradient end color input not found');
      expect(loggerWithErrors.error).toHaveBeenCalledWith(
        'Gradient end color text input not found'
      );
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Gradient angle input not found');
      expect(loggerWithErrors.error).toHaveBeenCalledWith('Gradient angle display span not found');
    });
  });
});
