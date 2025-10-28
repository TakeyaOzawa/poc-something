/**
 * Unit Tests: XPathEditModalManager
 */

import { XPathEditModalManager } from '../XPathEditModalManager';
import { XPathManagerPresenter } from '../XPathManagerPresenter';
import { Logger } from '@domain/types/logger.types';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  i18n: {
    getMessage: jest.fn((key: string) => {
      // Return the key as default, or specific mock values if needed
      return key;
    }),
  },
}));

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    applyToDOM: jest.fn(),
    getMessage: jest.fn((key: string) => {
      const messages: { [key: string]: string } = {
        editDataLoadFailed: '編集データの読み込みに失敗しました',
      };
      return messages[key] || key;
    }),
  },
}));

describe('XPathEditModalManager', () => {
  let manager: XPathEditModalManager;
  let mockPresenter: jest.Mocked<XPathManagerPresenter>;
  let mockLogger: jest.Mocked<Logger>;
  let mockView: any;

  beforeEach(() => {
    // Setup mock DOM elements
    document.body.innerHTML = `
      <div id="editModal"></div>
      <form id="editForm">
        <input id="editId" value="" />
        <input id="editValue" value="" />
        <select id="editActionType">
          <option value="type">Type</option>
          <option value="click">Click</option>
          <option value="check">Check</option>
          <option value="judge">Judge</option>
          <option value="select_value">Select Value</option>
          <option value="select_index">Select Index</option>
          <option value="select_text">Select Text</option>
          <option value="select_text_exact">Select Text Exact</option>
          <option value="change_url">Change URL</option>
          <option value="screenshot">Screenshot</option>
          <option value="get_value">Get Value</option>
        </select>
        <input id="editUrl" value="" />
        <input id="editExecutionOrder" value="1" />
        <select id="editSelectedPathPattern">
          <option value="smart">Smart</option>
        </select>
        <textarea id="editPathShort"></textarea>
        <textarea id="editPathAbsolute"></textarea>
        <textarea id="editPathSmart"></textarea>
        <input id="editAfterWaitSeconds" value="0" />
        <input id="editExecutionTimeoutSeconds" value="5" />
        <input id="editRetryType" value="0" />
        <select id="editActionPattern">
          <option value="0">0</option>
          <option value="20">20</option>
        </select>
        <label id="editActionPatternLabel"></label>
        <p id="actionPatternHelp"></p>
      </form>
      <div class="xpath-field"></div>
    `;

    // Setup templates for TemplateLoader
    const judgeTemplate = document.createElement('template');
    judgeTemplate.id = 'xpath-action-pattern-judge-template';
    judgeTemplate.innerHTML = `
      <option value="10" data-i18n="eventPatternJudge10">10 - 等しい (正規表現可)</option>
      <option value="20" data-i18n="eventPatternJudge20">20 - 等しくない (正規表現可)</option>
      <option value="30" data-i18n="eventPatternJudge30">30 - 大なり (数値/文字列)</option>
      <option value="40" data-i18n="eventPatternJudge40">40 - 小なり (数値/文字列)</option>
    `;
    document.body.appendChild(judgeTemplate);

    const selectTemplate = document.createElement('template');
    selectTemplate.id = 'xpath-action-pattern-select-template';
    selectTemplate.innerHTML = `
      <option value="10" data-i18n="eventPatternSelect10">10 - ネイティブselect（単一選択）</option>
      <option value="20" data-i18n="eventPatternSelect20">20 - カスタムコンポーネント（単一選択）</option>
      <option value="30" data-i18n="eventPatternSelect30">30 - Select2/jQuery（単一選択）</option>
      <option value="110" data-i18n="eventPatternSelect110">110 - ネイティブselect（複数選択）</option>
      <option value="120" data-i18n="eventPatternSelect120">120 - カスタムコンポーネント（複数選択）</option>
      <option value="130" data-i18n="eventPatternSelect130">130 - Select2/jQuery（複数選択）</option>
    `;
    document.body.appendChild(selectTemplate);

    const basicTemplate = document.createElement('template');
    basicTemplate.id = 'xpath-action-pattern-basic-template';
    basicTemplate.innerHTML = `
      <option value="10" data-i18n="eventPatternBasic10">10 - Basic（シンプル）</option>
      <option value="20" data-i18n="eventPatternFramework20">20 - Framework-agnostic（推奨）</option>
      <option value="0" data-i18n="eventPatternDefault0">0 - デフォルト（20として扱う）</option>
    `;
    document.body.appendChild(basicTemplate);

    const defaultTemplate = document.createElement('template');
    defaultTemplate.id = 'xpath-action-pattern-default-template';
    defaultTemplate.innerHTML = `
      <option value="0" data-i18n="actionPatternNone">0 (なし)</option>
    `;
    document.body.appendChild(defaultTemplate);

    const screenshotTemplate = document.createElement('template');
    screenshotTemplate.id = 'xpath-action-pattern-screenshot-template';
    screenshotTemplate.innerHTML = `
      <option value="100" data-i18n="screenshotQualityHigh">100 - 高画質</option>
      <option value="80" data-i18n="screenshotQualityMedium">80 - 中画質</option>
      <option value="60" data-i18n="screenshotQualityLow">60 - 低画質</option>
    `;
    document.body.appendChild(screenshotTemplate);

    const getvalueTemplate = document.createElement('template');
    getvalueTemplate.id = 'xpath-action-pattern-getvalue-template';
    getvalueTemplate.innerHTML = `
      <option value="10" data-i18n="getValuePatternValue">10 - value属性 (input/select/textarea)</option>
      <option value="20" data-i18n="getValuePatternTextContent">20 - textContent</option>
      <option value="30" data-i18n="getValuePatternInnerText">30 - innerText</option>
      <option value="40" data-i18n="getValuePatternInnerHTML">40 - innerHTML</option>
      <option value="50" data-i18n="getValuePatternDataAttribute">50 - data-* 属性</option>
    `;
    document.body.appendChild(getvalueTemplate);

    // Setup mock presenter
    mockPresenter = {
      getXPathById: jest.fn(),
      updateXPath: jest.fn(),
    } as any;

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Setup mock view
    mockView = {
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showProgress: jest.fn(),
      updateProgress: jest.fn(),
      hideProgress: jest.fn(),
      showXPaths: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showEmpty: jest.fn(),
    } as any;

    manager = new XPathEditModalManager(mockPresenter, mockLogger, mockView);

    // Mock alert
    global.alert = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    TemplateLoader.clearCache();
    jest.restoreAllMocks();
  });

  describe('openEditModal', () => {
    it('should load and display XPath data', async () => {
      const mockXPath = {
        id: 'xpath_1',
        value: 'test value',
        actionType: 'type',
        url: 'https://example.com',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        pathShort: '//input',
        pathAbsolute: '/html/body/input',
        pathSmart: '#input',
        afterWaitSeconds: 1.5,
        executionTimeoutSeconds: 10,
        retryType: 0,
        actionPattern: 20,
      };

      mockPresenter.getXPathById.mockResolvedValue(mockXPath as any);

      await manager.openEditModal('xpath_1');

      expect(mockPresenter.getXPathById).toHaveBeenCalledWith('xpath_1');
      expect((document.getElementById('editId') as HTMLInputElement).value).toBe('xpath_1');
      expect((document.getElementById('editValue') as HTMLInputElement).value).toBe('test value');
      expect((document.getElementById('editActionType') as HTMLSelectElement).value).toBe('type');
      expect((document.getElementById('editActionPattern') as HTMLSelectElement).value).toBe('20');
    });

    it('should return early if XPath not found', async () => {
      mockPresenter.getXPathById.mockResolvedValue(undefined);

      await manager.openEditModal('nonexistent');

      expect(mockPresenter.getXPathById).toHaveBeenCalledWith('nonexistent');
      const modal = document.getElementById('editModal');
      expect(modal?.classList.contains('show')).toBe(false);
    });

    it('should handle load error', async () => {
      mockPresenter.getXPathById.mockRejectedValue(new Error('Load failed'));

      await manager.openEditModal('xpath_1');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load XPath for editing',
        expect.any(Error)
      );
      expect(mockView.showError).toHaveBeenCalledWith('編集データの読み込みに失敗しました');
    });
  });

  describe('closeModal', () => {
    it('should close modal and reset form', () => {
      const modal = document.getElementById('editModal') as HTMLElement;
      const form = document.getElementById('editForm') as HTMLFormElement;
      modal.classList.add('show');
      form.reset = jest.fn();

      manager.closeModal();

      expect(modal.classList.contains('show')).toBe(false);
      expect(form.reset).toHaveBeenCalled();
    });
  });

  describe('saveXPath', () => {
    beforeEach(() => {
      (document.getElementById('editId') as HTMLInputElement).value = 'xpath_1';
      (document.getElementById('editValue') as HTMLInputElement).value = 'new value';
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'click';
      (document.getElementById('editUrl') as HTMLInputElement).value = 'https://example.com';
      (document.getElementById('editExecutionOrder') as HTMLInputElement).value = '2';
      (document.getElementById('editSelectedPathPattern') as HTMLSelectElement).value = 'smart';
      (document.getElementById('editPathShort') as HTMLTextAreaElement).value = '//button';
      (document.getElementById('editPathAbsolute') as HTMLTextAreaElement).value =
        '/html/body/button';
      (document.getElementById('editPathSmart') as HTMLTextAreaElement).value = '#button';
      (document.getElementById('editActionPattern') as HTMLSelectElement).value = '20';
      (document.getElementById('editAfterWaitSeconds') as HTMLInputElement).value = '2.5';
      (document.getElementById('editExecutionTimeoutSeconds') as HTMLInputElement).value = '15';
      (document.getElementById('editRetryType') as HTMLInputElement).value = '1';
    });

    it('should save XPath successfully', async () => {
      mockPresenter.updateXPath.mockResolvedValue();

      const result = await manager.saveXPath();

      expect(result).toBe(true);
      expect(mockPresenter.updateXPath).toHaveBeenCalledWith({
        id: 'xpath_1',
        value: 'new value',
        actionType: 'click',
        url: 'https://example.com',
        executionOrder: 2,
        selectedPathPattern: 'smart',
        pathShort: '//button',
        pathAbsolute: '/html/body/button',
        pathSmart: '#button',
        actionPattern: 20,
        afterWaitSeconds: 2.5,
        executionTimeoutSeconds: 15,
        retryType: 1,
      });
    });

    it('should return false on error', async () => {
      mockPresenter.updateXPath.mockRejectedValue(new Error('Update failed'));

      const result = await manager.saveXPath();

      expect(result).toBe(false);
    });
  });

  describe('handleActionTypeChange', () => {
    it('should hide XPath fields for change_url action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'change_url';
      const xpathField = document.querySelector('.xpath-field') as HTMLElement;

      manager.handleActionTypeChange();

      expect(xpathField.style.display).toBe('none');
    });

    it('should show XPath fields for other action types', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'type';
      const xpathField = document.querySelector('.xpath-field') as HTMLElement;

      manager.handleActionTypeChange();

      expect(xpathField.style.display).toBe('block');
    });

    it('should remove required attributes for change_url action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'change_url';
      const pathShort = document.getElementById('editPathShort') as HTMLElement;
      pathShort.setAttribute('required', 'required');

      manager.handleActionTypeChange();

      expect(pathShort.hasAttribute('required')).toBe(false);
    });

    it('should set required attributes for non-change_url action types', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'type';
      const pathShort = document.getElementById('editPathShort') as HTMLElement;
      const pathAbsolute = document.getElementById('editPathAbsolute') as HTMLElement;
      const pathSmart = document.getElementById('editPathSmart') as HTMLElement;
      const pathPattern = document.getElementById('editSelectedPathPattern') as HTMLElement;

      manager.handleActionTypeChange();

      expect(pathShort.hasAttribute('required')).toBe(true);
      expect(pathAbsolute.hasAttribute('required')).toBe(true);
      expect(pathSmart.hasAttribute('required')).toBe(true);
      expect(pathPattern.hasAttribute('required')).toBe(true);
    });

    it('should set judge pattern options for judge action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'judge';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;
      const actionPatternLabel = document.getElementById('editActionPatternLabel') as HTMLElement;
      const actionPatternHelp = document.getElementById('actionPatternHelp') as HTMLElement;

      manager.handleActionTypeChange();

      expect(actionPatternLabel.textContent).toContain('comparisonMethod');
      expect(actionPatternSelect.innerHTML).toContain('等しい');
      expect(actionPatternHelp.style.display).toBe('block');
    });

    it('should set select pattern options for select_value action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'select_value';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;
      const actionPatternLabel = document.getElementById('editActionPatternLabel') as HTMLElement;

      manager.handleActionTypeChange();

      expect(actionPatternLabel.textContent).toContain('selectOptionsLabel');
      expect(actionPatternSelect.innerHTML).toContain('ネイティブselect');
    });

    it('should set select pattern options for select_index action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'select_index';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;

      manager.handleActionTypeChange();

      expect(actionPatternSelect.innerHTML).toContain('ネイティブselect');
    });

    it('should set select pattern options for select_text action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'select_text';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;

      manager.handleActionTypeChange();

      expect(actionPatternSelect.innerHTML).toContain('ネイティブselect');
    });

    it('should set select pattern options for select_text_exact action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'select_text_exact';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;

      manager.handleActionTypeChange();

      expect(actionPatternSelect.innerHTML).toContain('ネイティブselect');
    });

    it('should set basic event pattern options for type action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'type';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;
      const actionPatternLabel = document.getElementById('editActionPatternLabel') as HTMLElement;

      manager.handleActionTypeChange();

      expect(actionPatternLabel.textContent).toContain('eventPattern');
      expect(actionPatternSelect.innerHTML).toContain('Basic');
      expect(actionPatternSelect.innerHTML).toContain('Framework-agnostic');
    });

    it('should set basic event pattern options for click action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'click';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;

      manager.handleActionTypeChange();

      expect(actionPatternSelect.innerHTML).toContain('Basic');
    });

    it('should set basic event pattern options for check action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'check';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;

      manager.handleActionTypeChange();

      expect(actionPatternSelect.innerHTML).toContain('Basic');
    });

    it('should set screenshot pattern options for screenshot action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'screenshot';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;
      const actionPatternLabel = document.getElementById('editActionPatternLabel') as HTMLElement;

      manager.handleActionTypeChange();

      expect(actionPatternLabel.textContent).toContain('screenshotQuality');
      expect(actionPatternSelect.innerHTML).toContain('高画質');
    });

    it('should set get_value pattern options for get_value action type', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'get_value';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;
      const actionPatternLabel = document.getElementById('editActionPatternLabel') as HTMLElement;

      manager.handleActionTypeChange();

      expect(actionPatternLabel.textContent).toContain('getValuePattern');
      expect(actionPatternSelect.innerHTML).toContain('value属性');
    });

    it('should set default pattern options for unknown action types', () => {
      (document.getElementById('editActionType') as HTMLSelectElement).value = 'unknown_action';
      const actionPatternSelect = document.getElementById('editActionPattern') as HTMLSelectElement;
      const actionPatternHelp = document.getElementById('actionPatternHelp') as HTMLElement;

      manager.handleActionTypeChange();

      expect(actionPatternSelect.innerHTML).toContain('なし');
      expect(actionPatternHelp.style.display).toBe('none');
    });
  });
});
