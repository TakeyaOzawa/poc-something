import { I18nAdapter } from '../I18nAdapter';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  i18n: {
    getMessage: jest.fn(),
    getUILanguage: jest.fn(),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('I18nAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessage', () => {
    it('should get message without substitutions', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('Auto Fill Tool');

      const result = I18nAdapter.getMessage('extensionName');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('extensionName', undefined);
      expect(result).toBe('Auto Fill Tool');
    });

    it('should get message with string substitution', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('インポートに失敗しました: エラー');

      const result = I18nAdapter.getMessage('importFailed', 'エラー');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('importFailed', 'エラー');
      expect(result).toBe('インポートに失敗しました: エラー');
    });

    it('should get message with array substitutions', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('Step 3 / 10');

      const result = I18nAdapter.getMessage('stepProgress', ['3', '10']);

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('stepProgress', ['3', '10']);
      expect(result).toBe('Step 3 / 10');
    });

    it('should handle non-existent message key returning empty string', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('');

      const result = I18nAdapter.getMessage('unknownError');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('unknownError', undefined);
      expect(result).toBe('');
    });
  });

  describe('getLocale', () => {
    it('should return current locale as "ja"', () => {
      (browser.i18n.getUILanguage as jest.Mock).mockReturnValue('ja');

      const result = I18nAdapter.getLocale();

      expect(browser.i18n.getUILanguage).toHaveBeenCalled();
      expect(result).toBe('ja');
    });

    it('should return current locale as "en"', () => {
      (browser.i18n.getUILanguage as jest.Mock).mockReturnValue('en');

      const result = I18nAdapter.getLocale();

      expect(browser.i18n.getUILanguage).toHaveBeenCalled();
      expect(result).toBe('en');
    });

    it('should return current locale as "en-US"', () => {
      (browser.i18n.getUILanguage as jest.Mock).mockReturnValue('en-US');

      const result = I18nAdapter.getLocale();

      expect(browser.i18n.getUILanguage).toHaveBeenCalled();
      expect(result).toBe('en-US');
    });
  });

  describe('format', () => {
    it('should format message with single substitution', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue(
        'インポートに失敗しました: Invalid CSV'
      );

      const result = I18nAdapter.getMessage('importFailed', 'Invalid CSV');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('importFailed', 'Invalid CSV');
      expect(result).toBe('インポートに失敗しました: Invalid CSV');
    });

    it('should format message with multiple substitutions', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('ステップ 5 / 20');

      const result = I18nAdapter.getMessage('stepProgress', ['5', '20']);

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('stepProgress', ['5', '20']);
      expect(result).toBe('ステップ 5 / 20');
    });

    it('should format message with no substitutions', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('XPathを保存しました');

      const result = I18nAdapter.getMessage('xpathSaved');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('xpathSaved', undefined);
      expect(result).toBe('XPathを保存しました');
    });

    it('should format message with empty substitutions array', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('キャンセル');

      const result = I18nAdapter.getMessage('cancel');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('cancel', undefined);
      expect(result).toBe('キャンセル');
    });
  });

  describe('hasMessage', () => {
    it('should return true when message exists', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('Auto Fill Tool');

      const result = I18nAdapter.hasMessage('extensionName');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('extensionName');
      expect(result).toBe(true);
    });

    it('should return false when getMessage returns empty string', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('');

      const result = I18nAdapter.hasMessage('cancel');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('cancel');
      expect(result).toBe(false);
    });

    it('should return true for messages with content', () => {
      (browser.i18n.getMessage as jest.Mock).mockReturnValue('XPathを保存しました');

      const result = I18nAdapter.hasMessage('xpathSaved');

      expect(browser.i18n.getMessage).toHaveBeenCalledWith('xpathSaved');
      expect(result).toBe(true);
    });

    it('should check multiple messages for existence', () => {
      (browser.i18n.getMessage as jest.Mock)
        .mockReturnValueOnce('XPathを削除しました')
        .mockReturnValueOnce('');

      const result1 = I18nAdapter.hasMessage('xpathDeleted');
      const result2 = I18nAdapter.hasMessage('xpathDuplicated');

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('type safety with MessageKey', () => {
    it('should accept all valid MessageKey types', () => {
      const validKeys: Array<Parameters<typeof I18nAdapter.getMessage>[0]> = [
        'extensionName',
        'extensionDescription',
        'autoFillInProgress',
        'preparing',
        'cancel',
        'escKeyHint',
        'stepProgress',
        'xpathLoadFailed',
        'xpathSaved',
        'saveFailed',
        'xpathDeleted',
        'deleteFailed',
        'xpathDuplicated',
        'xpathNotFound',
        'duplicateFailed',
        'exportFailed',
        'importCompleted',
        'importFailed',
        'unknownError',
        'xpathGetFailed',
      ];

      (browser.i18n.getMessage as jest.Mock).mockReturnValue('test message');

      validKeys.forEach((key) => {
        expect(() => I18nAdapter.getMessage(key)).not.toThrow();
      });

      expect(browser.i18n.getMessage).toHaveBeenCalledTimes(validKeys.length);
    });
  });

  describe('applyToDOM', () => {
    beforeEach(() => {
      // Reset DOM
      document.body.innerHTML = '';
      jest.clearAllMocks();
    });

    describe('data-i18n attribute (text content)', () => {
      it('should apply i18n to elements with data-i18n attribute', () => {
        document.body.innerHTML = '<div data-i18n="extensionName"></div>';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('Auto Fill Tool');

        I18nAdapter.applyToDOM();

        const element = document.querySelector('[data-i18n]');
        expect(element?.textContent).toBe('Auto Fill Tool');
        expect(browser.i18n.getMessage).toHaveBeenCalledWith('extensionName');
      });

      it('should apply i18n to multiple elements', () => {
        document.body.innerHTML = `
          <div data-i18n="extensionName"></div>
          <span data-i18n="cancel"></span>
          <p data-i18n="save"></p>
        `;
        (browser.i18n.getMessage as jest.Mock)
          .mockReturnValueOnce('Auto Fill Tool')
          .mockReturnValueOnce('キャンセル')
          .mockReturnValueOnce('保存');

        I18nAdapter.applyToDOM();

        expect(document.querySelector('div')?.textContent).toBe('Auto Fill Tool');
        expect(document.querySelector('span')?.textContent).toBe('キャンセル');
        expect(document.querySelector('p')?.textContent).toBe('保存');
      });

      it('should not modify element if message is empty', () => {
        document.body.innerHTML = '<div data-i18n="unknownKey">Original</div>';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('');

        I18nAdapter.applyToDOM();

        expect(document.querySelector('div')?.textContent).toBe('Original');
      });

      it('should handle missing data-i18n attribute gracefully', () => {
        document.body.innerHTML = '<div></div>';

        expect(() => I18nAdapter.applyToDOM()).not.toThrow();
      });
    });

    describe('data-i18n-placeholder attribute', () => {
      it('should apply i18n to input placeholder', () => {
        document.body.innerHTML = '<input data-i18n-placeholder="websiteNamePlaceholder" />';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('Enter website name');

        I18nAdapter.applyToDOM();

        const input = document.querySelector('input') as HTMLInputElement;
        expect(input?.placeholder).toBe('Enter website name');
        expect(browser.i18n.getMessage).toHaveBeenCalledWith('websiteNamePlaceholder');
      });

      it('should apply i18n to multiple input placeholders', () => {
        document.body.innerHTML = `
          <input data-i18n-placeholder="websiteNamePlaceholder" />
          <input data-i18n-placeholder="valuePlaceholder" />
        `;
        (browser.i18n.getMessage as jest.Mock)
          .mockReturnValueOnce('Enter website name')
          .mockReturnValueOnce('Enter value');

        I18nAdapter.applyToDOM();

        const inputs = document.querySelectorAll('input');
        expect(inputs[0]?.placeholder).toBe('Enter website name');
        expect(inputs[1]?.placeholder).toBe('Enter value');
      });

      it('should not modify placeholder if message is empty', () => {
        document.body.innerHTML =
          '<input data-i18n-placeholder="unknownKey" placeholder="Original" />';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('');

        I18nAdapter.applyToDOM();

        const input = document.querySelector('input') as HTMLInputElement;
        expect(input?.placeholder).toBe('Original');
      });

      it('should only apply to HTMLInputElement', () => {
        document.body.innerHTML = '<div data-i18n-placeholder="websiteNamePlaceholder"></div>';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('Enter website name');

        I18nAdapter.applyToDOM();

        // Div does not have placeholder, so getMessage should not be called
        expect(browser.i18n.getMessage).not.toHaveBeenCalled();
      });
    });

    describe('data-i18n-title attribute', () => {
      it('should apply i18n to title attribute', () => {
        document.body.innerHTML = '<button data-i18n-title="save"></button>';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('Save settings');

        I18nAdapter.applyToDOM();

        const button = document.querySelector('button');
        expect(button?.getAttribute('title')).toBe('Save settings');
        expect(browser.i18n.getMessage).toHaveBeenCalledWith('save');
      });

      it('should apply i18n to multiple elements with title', () => {
        document.body.innerHTML = `
          <button data-i18n-title="save"></button>
          <button data-i18n-title="cancel"></button>
        `;
        (browser.i18n.getMessage as jest.Mock)
          .mockReturnValueOnce('Save settings')
          .mockReturnValueOnce('Cancel');

        I18nAdapter.applyToDOM();

        const buttons = document.querySelectorAll('button');
        expect(buttons[0]?.getAttribute('title')).toBe('Save settings');
        expect(buttons[1]?.getAttribute('title')).toBe('Cancel');
      });

      it('should not modify title if message is empty', () => {
        document.body.innerHTML = '<button data-i18n-title="unknownKey" title="Original"></button>';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('');

        I18nAdapter.applyToDOM();

        const button = document.querySelector('button');
        expect(button?.getAttribute('title')).toBe('Original');
      });
    });

    describe('data-i18n-aria attribute', () => {
      it('should apply i18n to aria-label attribute', () => {
        document.body.innerHTML = '<button data-i18n-aria="closeButton"></button>';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('Close dialog');

        I18nAdapter.applyToDOM();

        const button = document.querySelector('button');
        expect(button?.getAttribute('aria-label')).toBe('Close dialog');
        expect(browser.i18n.getMessage).toHaveBeenCalledWith('closeButton');
      });

      it('should apply i18n to multiple elements with aria-label', () => {
        document.body.innerHTML = `
          <button data-i18n-aria="save"></button>
          <button data-i18n-aria="cancel"></button>
        `;
        (browser.i18n.getMessage as jest.Mock)
          .mockReturnValueOnce('Save')
          .mockReturnValueOnce('Cancel');

        I18nAdapter.applyToDOM();

        const buttons = document.querySelectorAll('button');
        expect(buttons[0]?.getAttribute('aria-label')).toBe('Save');
        expect(buttons[1]?.getAttribute('aria-label')).toBe('Cancel');
      });

      it('should not modify aria-label if message is empty', () => {
        document.body.innerHTML =
          '<button data-i18n-aria="unknownKey" aria-label="Original"></button>';
        (browser.i18n.getMessage as jest.Mock).mockReturnValue('');

        I18nAdapter.applyToDOM();

        const button = document.querySelector('button');
        expect(button?.getAttribute('aria-label')).toBe('Original');
      });
    });

    describe('custom root element', () => {
      it('should apply i18n to custom root element', () => {
        const container = document.createElement('div');
        container.innerHTML = '<span data-i18n="extensionName"></span>';
        document.body.appendChild(container);

        (browser.i18n.getMessage as jest.Mock).mockReturnValue('Auto Fill Tool');

        I18nAdapter.applyToDOM(container);

        const span = container.querySelector('span');
        expect(span?.textContent).toBe('Auto Fill Tool');
      });

      it('should not affect elements outside custom root', () => {
        const container = document.createElement('div');
        container.innerHTML = '<span data-i18n="extensionName"></span>';
        document.body.innerHTML = '<div data-i18n="cancel">Original</div>';
        document.body.appendChild(container);

        (browser.i18n.getMessage as jest.Mock).mockReturnValue('Auto Fill Tool');

        I18nAdapter.applyToDOM(container);

        const outsideDiv = document.body.querySelector('div[data-i18n="cancel"]');
        expect(outsideDiv?.textContent).toBe('Original'); // Should not be changed
      });
    });

    describe('combined attributes', () => {
      it('should apply all i18n attributes to the same element', () => {
        document.body.innerHTML = `
          <input
            data-i18n-placeholder="websiteNamePlaceholder"
            data-i18n-title="save"
            data-i18n-aria="closeButton"
          />
        `;
        (browser.i18n.getMessage as jest.Mock)
          .mockReturnValueOnce('Enter website name')
          .mockReturnValueOnce('Save settings')
          .mockReturnValueOnce('Close dialog');

        I18nAdapter.applyToDOM();

        const input = document.querySelector('input') as HTMLInputElement;
        expect(input?.placeholder).toBe('Enter website name');
        expect(input?.getAttribute('title')).toBe('Save settings');
        expect(input?.getAttribute('aria-label')).toBe('Close dialog');
      });

      it('should handle mixed elements with different i18n attributes', () => {
        document.body.innerHTML = `
          <div data-i18n="extensionName"></div>
          <input data-i18n-placeholder="websiteNamePlaceholder" />
          <button data-i18n-title="save"></button>
          <button data-i18n-aria="closeButton"></button>
        `;
        (browser.i18n.getMessage as jest.Mock)
          .mockReturnValueOnce('Auto Fill Tool')
          .mockReturnValueOnce('Enter website name')
          .mockReturnValueOnce('Save settings')
          .mockReturnValueOnce('Close dialog');

        I18nAdapter.applyToDOM();

        expect(document.querySelector('div')?.textContent).toBe('Auto Fill Tool');
        expect((document.querySelector('input') as HTMLInputElement)?.placeholder).toBe(
          'Enter website name'
        );
        expect(document.querySelectorAll('button')[0]?.getAttribute('title')).toBe('Save settings');
        expect(document.querySelectorAll('button')[1]?.getAttribute('aria-label')).toBe(
          'Close dialog'
        );
      });
    });
  });
});
