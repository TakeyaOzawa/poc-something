/**
 * Test for VariableManager
 */

import { VariableManager } from '../VariableManager';
import { Logger } from '@domain/types/logger.types';
import { GetWebsiteByIdUseCase } from '@usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase } from '@usecases/websites/UpdateWebsiteUseCase';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { Website } from '@domain/entities/Website';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { XPathManagerView } from '../XPathManagerPresenter';
import { Result } from '@domain/values/result.value';

// Mock modules
jest.mock('@infrastructure/repositories/ChromeStorageAutomationVariablesRepository');
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        selectWebsitePrompt: 'Please select a website',
        websiteNotFound: 'Website not found',
        variableNameAndValueRequired: 'Variable name and value are required',
        variableAddFailed: 'Failed to add variable',
        variableDeleteFailed: 'Failed to delete variable',
        variableNotFound: 'Variable not found',
      };
      return messages[key] || key;
    }),
    format: jest.fn((key: string, ...args: string[]) => {
      const messages: Record<string, string> = {
        confirmDeleteVariable: `Are you sure you want to delete variable "${args[0]}"?`,
      };
      return messages[key] || key;
    }),
  },
}));

describe('VariableManager', () => {
  let manager: VariableManager;
  let mockVariablesList: HTMLDivElement;
  let mockNewVariableName: HTMLInputElement;
  let mockNewVariableValue: HTMLInputElement;
  let mockLogger: jest.Mocked<Logger>;
  let mockView: jest.Mocked<XPathManagerView>;
  let mockGetCurrentWebsiteId: jest.Mock;
  let mockGetWebsiteByIdUseCase: jest.Mocked<GetWebsiteByIdUseCase>;
  let mockUpdateWebsiteUseCase: jest.Mocked<UpdateWebsiteUseCase>;
  let mockAutomationVariablesRepository: jest.Mocked<ChromeStorageAutomationVariablesRepository>;
  let alertSpy: jest.SpyInstance;
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    // Set up variable-item-template for VariableManager component
    const variableItemTemplate = document.createElement('template');
    variableItemTemplate.id = 'variable-item-template';
    variableItemTemplate.innerHTML = `
      <div class="variable-item">
        <div class="variable-content">
          <div class="variable-name" data-bind="name"></div>
          <div class="variable-value" data-bind="value"></div>
        </div>
        <button class="btn-danger variable-delete" data-bind-attr="variableName:data-variable-name">
          🗑️ <span data-i18n="delete">削除</span>
        </button>
      </div>
    `;
    document.body.appendChild(variableItemTemplate);

    // Create DOM elements
    mockVariablesList = document.createElement('div');
    mockNewVariableName = document.createElement('input');
    mockNewVariableValue = document.createElement('input');

    // Create mocks
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    mockView = {
      showXPaths: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showEmpty: jest.fn(),
      showProgress: jest.fn(),
      updateProgress: jest.fn(),
      hideProgress: jest.fn(),
    } as any;

    mockGetCurrentWebsiteId = jest.fn();

    mockGetWebsiteByIdUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateWebsiteUseCase = {
      execute: jest.fn(),
    } as any;

    mockAutomationVariablesRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    (ChromeStorageAutomationVariablesRepository as jest.Mock).mockImplementation(
      () => mockAutomationVariablesRepository
    );

    // Mock alert and confirm
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    // Create manager
    manager = new VariableManager(
      mockVariablesList,
      mockNewVariableName,
      mockNewVariableValue,
      mockLogger,
      mockView,
      mockGetCurrentWebsiteId,
      mockGetWebsiteByIdUseCase,
      mockUpdateWebsiteUseCase
    );
  });

  afterEach(() => {
    // Clean up template
    const variableItemTemplate = document.getElementById('variable-item-template');
    if (variableItemTemplate) {
      variableItemTemplate.remove();
    }

    jest.clearAllMocks();
    alertSpy.mockRestore();
    confirmSpy.mockRestore();
  });

  describe('loadVariables', () => {
    it('should show message when no website is selected', async () => {
      mockGetCurrentWebsiteId.mockReturnValue('');

      await manager.loadVariables();

      expect(mockVariablesList.innerHTML).toContain('サイトを選択してください');
      expect(mockGetWebsiteByIdUseCase.execute).not.toHaveBeenCalled();
    });

    it('should show error when website is not found', async () => {
      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: null });

      await manager.loadVariables();

      expect(mockVariablesList.innerHTML).toContain('サイトが見つかりません');
    });

    it('should show message when no variables are registered', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));

      await manager.loadVariables();

      expect(mockVariablesList.innerHTML).toContain('変数が登録されていません');
    });

    it('should display variables with delete buttons', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      const automationVariables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {
          username: 'testuser',
          password: 'testpass',
        },
      });

      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));

      await manager.loadVariables();

      expect(mockVariablesList.innerHTML).toContain('{{username}}');
      expect(mockVariablesList.innerHTML).toContain('testuser');
      expect(mockVariablesList.innerHTML).toContain('{{password}}');
      expect(mockVariablesList.innerHTML).toContain('testpass');
      expect(mockVariablesList.innerHTML).toContain('btn-danger');
    });

    it('should handle errors during load', async () => {
      const error = new Error('Load failed');
      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockRejectedValue(error);

      await manager.loadVariables();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load variables', error);
      expect(mockVariablesList.innerHTML).toContain('変数の読み込みに失敗しました');
    });

    it('should escape HTML in variable names and values', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      const automationVariables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {
          '<script>alert("xss")</script>': '<img src=x onerror=alert(1)>',
        },
      });

      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));

      await manager.loadVariables();

      // Check that variable name and value are properly escaped in displayed content (textContent)
      const variableNameEl = mockVariablesList.querySelector('.variable-name');
      const variableValueEl = mockVariablesList.querySelector('.variable-value');

      expect(variableNameEl?.textContent).toContain('{{<script>alert("xss")</script>}}');
      expect(variableValueEl?.textContent).toBe('<img src=x onerror=alert(1)>');

      // Verify HTML entities are used in innerHTML (escaped automatically by textContent)
      expect(mockVariablesList.innerHTML).toContain('&lt;script&gt;');
      expect(mockVariablesList.innerHTML).toContain('&lt;/script&gt;');
      expect(mockVariablesList.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;');
    });
  });

  describe('addVariable', () => {
    it('should show error if name is empty', async () => {
      mockNewVariableName.value = '';
      mockNewVariableValue.value = 'test value';

      await manager.addVariable();

      expect(mockView.showError).toHaveBeenCalledWith('Variable name and value are required');
      expect(mockGetWebsiteByIdUseCase.execute).not.toHaveBeenCalled();
    });

    it('should show error if value is empty', async () => {
      mockNewVariableName.value = 'test';
      mockNewVariableValue.value = '';

      await manager.addVariable();

      expect(mockView.showError).toHaveBeenCalledWith('Variable name and value are required');
      expect(mockGetWebsiteByIdUseCase.execute).not.toHaveBeenCalled();
    });

    it('should show error if no website is selected', async () => {
      mockNewVariableName.value = 'test';
      mockNewVariableValue.value = 'value';
      mockGetCurrentWebsiteId.mockReturnValue('');

      await manager.addVariable();

      expect(mockView.showError).toHaveBeenCalledWith('Please select a website');
    });

    it('should show error if website is not found', async () => {
      mockNewVariableName.value = 'test';
      mockNewVariableValue.value = 'value';
      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: null });

      await manager.addVariable();

      expect(mockView.showError).toHaveBeenCalledWith('Website not found');
    });

    it('should add new variable and clear inputs', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      mockNewVariableName.value = 'newVar';
      mockNewVariableValue.value = 'newValue';
      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.addVariable();

      expect(mockAutomationVariablesRepository.save).toHaveBeenCalled();
      expect(mockNewVariableName.value).toBe('');
      expect(mockNewVariableValue.value).toBe('');
    });

    it('should add variable to existing automation variables', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      const existingVariables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: { existing: 'value' },
      });

      mockNewVariableName.value = 'newVar';
      mockNewVariableValue.value = 'newValue';
      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(existingVariables));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.addVariable();

      const savedVariables = mockAutomationVariablesRepository.save.mock.calls[0][0];
      expect(savedVariables.getVariables()).toEqual({
        existing: 'value',
        newVar: 'newValue',
      });
    });

    it('should trim whitespace from name and value', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      mockNewVariableName.value = '  newVar  ';
      mockNewVariableValue.value = '  newValue  ';
      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      await manager.addVariable();

      const savedVariables = mockAutomationVariablesRepository.save.mock.calls[0][0];
      expect(savedVariables.getVariables()).toEqual({
        newVar: 'newValue',
      });
    });

    it('should handle errors during add', async () => {
      const error = new Error('Save failed');
      const website = Website.create({
        name: 'Test Website',
      });

      mockNewVariableName.value = 'newVar';
      mockNewVariableValue.value = 'newValue';
      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockRejectedValue(error);

      await manager.addVariable();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to add variable', error);
      expect(mockView.showError).toHaveBeenCalledWith('Failed to add variable');
    });
  });

  describe('deleteVariable', () => {
    it('should delete variable when confirmed', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      const automationVariables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {
          username: 'testuser',
          password: 'testpass',
        },
      });

      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));
      confirmSpy.mockReturnValue(true);

      await manager.loadVariables();

      // Simulate delete button click
      const deleteButton = mockVariablesList.querySelector(
        '.btn-danger[data-variable-name="username"]'
      ) as HTMLButtonElement;
      expect(deleteButton).toBeTruthy();

      deleteButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockAutomationVariablesRepository.save).toHaveBeenCalled();
    });

    it('should not delete variable when cancelled', async () => {
      const website = Website.create({
        name: 'Test Website',
      });

      const automationVariables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {
          username: 'testuser',
        },
      });

      mockGetCurrentWebsiteId.mockReturnValue('website-1');
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: website.toData(),
      });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      confirmSpy.mockReturnValue(false);

      await manager.loadVariables();

      const deleteButton = mockVariablesList.querySelector('.btn-danger') as HTMLButtonElement;
      deleteButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockAutomationVariablesRepository.save).not.toHaveBeenCalled();
    });
  });
});
