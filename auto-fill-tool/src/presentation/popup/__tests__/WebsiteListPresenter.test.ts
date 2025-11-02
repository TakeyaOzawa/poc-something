/**
 * Unit Tests: WebsiteListPresenter
 */

import { WebsiteListPresenter } from '../WebsiteListPresenter';
import { ModalManager } from '../ModalManager';
import { WebsiteActionHandler } from '../WebsiteActionHandler';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveWebsiteWithAutomationVariablesUseCase } from '@usecases/websites/SaveWebsiteWithAutomationVariablesUseCase';
import { DeleteWebsiteUseCase } from '@usecases/websites/DeleteWebsiteUseCase';
import { WebsiteData } from '@domain/entities/Website';
import { Logger } from '@domain/types/logger.types';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock dependencies
jest.mock('../ModalManager');
jest.mock('../WebsiteActionHandler');
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: { [key: string]: string } = {
        websiteNotFound: 'Webサイトが見つかりません',
        confirmDeleteWebsite:
          'このWebサイト設定を削除しますか？関連するXPathもすべて削除されます。',
        deleteFailed: '削除に失敗しました',
        websiteNameRequired: '名前を入力してください',
        saveFailed: '保存に失敗しました',
      };
      return messages[key] || key;
    }),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('WebsiteListPresenter', () => {
  let controller: WebsiteListPresenter;
  let mockModalManager: jest.Mocked<ModalManager>;
  let mockActionHandler: jest.Mocked<WebsiteActionHandler>;
  let mockGetAllWebsitesUseCase: jest.Mocked<GetAllWebsitesUseCase>;
  let mockGetAllAutomationVariablesUseCase: jest.Mocked<GetAllAutomationVariablesUseCase>;
  let mockGetAutomationVariablesByWebsiteIdUseCase: jest.Mocked<GetAutomationVariablesByWebsiteIdUseCase>;
  let mockSaveWebsiteWithAutomationVariablesUseCase: jest.Mocked<SaveWebsiteWithAutomationVariablesUseCase>;
  let mockDeleteWebsiteUseCase: jest.Mocked<DeleteWebsiteUseCase>;
  let mockLogger: jest.Mocked<Logger>;

  const mockWebsites: WebsiteData[] = [
    {
      id: 'website_1',
      name: 'Test Website 1',
      updatedAt: '2025-01-01T00:00:00Z',
      editable: true,
      startUrl: 'https://example.com',
    },
    {
      id: 'website_2',
      name: 'Test Website 2',
      updatedAt: '2025-01-02T00:00:00Z',
      editable: true,
      startUrl: 'https://test.com',
    },
  ];

  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = '<div id="websiteList"></div>';

    // Setup mocks
    mockModalManager = {
      openAddModal: jest.fn(),
      openEditModal: jest.fn(),
      closeModal: jest.fn(),
      getFormData: jest.fn(),
    } as any;

    mockActionHandler = {
      executeWebsite: jest.fn(),
    } as any;

    mockGetAllWebsitesUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetAllAutomationVariablesUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetAutomationVariablesByWebsiteIdUseCase = {
      execute: jest.fn(),
    } as any;

    mockSaveWebsiteWithAutomationVariablesUseCase = {
      execute: jest.fn(),
    } as any;

    mockDeleteWebsiteUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    controller = new WebsiteListPresenter(
      mockModalManager,
      mockActionHandler,
      mockGetAllWebsitesUseCase,
      mockGetAllAutomationVariablesUseCase,
      mockGetAutomationVariablesByWebsiteIdUseCase,
      mockSaveWebsiteWithAutomationVariablesUseCase,
      mockDeleteWebsiteUseCase,
      mockLogger
    );

    // Mock alert and confirm
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loadAndRender', () => {
    it('should load and render websites', async () => {
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });

      await controller.loadAndRender();

      expect(mockGetAllWebsitesUseCase.execute).toHaveBeenCalled();
      expect(mockGetAllAutomationVariablesUseCase.execute).toHaveBeenCalled();
      // Note: Alpine.js handles DOM rendering, no need to test renderer
    });
  });

  describe('attachWebsiteListeners', () => {
    it('should attach event listeners to buttons', () => {
      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="execute" data-id="website_1">Execute</button>
          <button data-action="edit" data-id="website_1">Edit</button>
          <button data-action="delete" data-id="website_1">Delete</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      expect(mockLogger.info).toHaveBeenCalledWith('Attaching website listeners', {
        buttonCount: 3,
      });
    });

    it('should warn when button has no ID', () => {
      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="execute">No ID</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="execute"]') as HTMLElement;
      button.click();

      expect(mockLogger.warn).toHaveBeenCalledWith('No ID found on clicked button');
    });

    it('should execute website when execute button is clicked', async () => {
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="execute" data-id="website_1">Execute</button>
        </div>
      `;

      mockActionHandler.executeWebsite.mockResolvedValue(true);

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="execute"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockActionHandler.executeWebsite).toHaveBeenCalledWith(mockWebsites[0]);
    });

    it('should handle execute website not found', async () => {
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="execute" data-id="nonexistent">Execute</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="execute"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.alert).toHaveBeenCalledWith('Webサイトが見つかりません');
    });

    it('should open edit modal when edit button is clicked', async () => {
      const mockAv = { getWebsiteId: () => 'website_1' } as any;
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      mockGetAutomationVariablesByWebsiteIdUseCase.execute.mockResolvedValue({
        automationVariables: mockAv,
      });
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="edit" data-id="website_1">Edit</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="edit"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockModalManager.openEditModal).toHaveBeenCalledWith(mockWebsites[0], mockAv);
      expect(controller.editingId).toBe('website_1');
    });

    it('should handle edit modal for nonexistent website', async () => {
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="edit" data-id="nonexistent">Edit</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="edit"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.alert).toHaveBeenCalledWith('Webサイトが見つかりません');
    });

    it('should delete website when delete button is clicked', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      mockDeleteWebsiteUseCase.execute.mockResolvedValue({ success: true });
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="delete" data-id="website_1">Delete</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="delete"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.confirm).toHaveBeenCalledWith(
        'このWebサイト設定を削除しますか？関連するXPathもすべて削除されます。'
      );
      expect(mockDeleteWebsiteUseCase.execute).toHaveBeenCalledWith({ websiteId: 'website_1' });
    });

    it('should not delete when user cancels confirm', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="delete" data-id="website_1">Delete</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="delete"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockDeleteWebsiteUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle delete error', async () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      mockDeleteWebsiteUseCase.execute.mockRejectedValue(new Error('Delete failed'));
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="delete" data-id="website_1">Delete</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="delete"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to delete website', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('削除に失敗しました');
    });

    it('should warn for unknown action', async () => {
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });
      await controller.loadAndRender();

      document.body.innerHTML = `
        <div id="websiteList">
          <button data-action="unknown" data-id="website_1">Unknown</button>
        </div>
      `;

      controller.attachWebsiteListeners();

      const button = document.querySelector('[data-action="unknown"]') as HTMLElement;
      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockLogger.warn).toHaveBeenCalledWith('Unknown action', { action: 'unknown' });
    });
  });

  describe('openAddModal', () => {
    it('should open add modal', () => {
      controller.openAddModal();

      expect(mockModalManager.openAddModal).toHaveBeenCalled();
      expect(controller.editingId).toBeNull();
    });
  });

  describe('saveWebsite', () => {
    it('should create new website', async () => {
      controller.editingId = null;
      const mockEvent = { preventDefault: jest.fn() } as any;
      const newWebsite = {
        id: 'new_id',
        name: 'New Website',
        startUrl: 'https://new.com',
        updatedAt: '2025-01-01T00:00:00Z',
        editable: true,
      };

      mockModalManager.getFormData.mockReturnValue({
        name: 'New Website',
        status: AUTOMATION_STATUS.ENABLED,
        editable: true,
        startUrl: 'https://new.com',
        variables: { key: 'value' },
      });

      mockSaveWebsiteWithAutomationVariablesUseCase.execute.mockResolvedValue({
        success: true,
        website: newWebsite,
      });
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: [newWebsite],
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });

      await controller.saveWebsite(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockSaveWebsiteWithAutomationVariablesUseCase.execute).toHaveBeenCalledWith({
        websiteId: undefined,
        name: 'New Website',
        startUrl: 'https://new.com',
        status: AUTOMATION_STATUS.ENABLED,
        variables: { key: 'value' },
      });
      expect(mockModalManager.closeModal).toHaveBeenCalled();
    });

    it('should update existing website', async () => {
      controller.editingId = 'website_1';
      const mockEvent = { preventDefault: jest.fn() } as any;

      mockModalManager.getFormData.mockReturnValue({
        name: 'Updated Website',
        status: AUTOMATION_STATUS.DISABLED,
        editable: true,
        startUrl: 'https://updated.com',
        variables: { newKey: 'newValue' },
      });

      const updatedWebsite = {
        ...mockWebsites[0],
        name: 'Updated Website',
        startUrl: 'https://updated.com',
      };

      mockSaveWebsiteWithAutomationVariablesUseCase.execute.mockResolvedValue({
        success: true,
        website: updatedWebsite,
      });
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });
      mockGetAllAutomationVariablesUseCase.execute.mockResolvedValue({ automationVariables: [] });

      // Setup current websites
      await controller.loadAndRender();

      await controller.saveWebsite(mockEvent);

      expect(mockSaveWebsiteWithAutomationVariablesUseCase.execute).toHaveBeenCalledWith({
        websiteId: 'website_1',
        name: 'Updated Website',
        startUrl: 'https://updated.com',
        status: AUTOMATION_STATUS.DISABLED,
        variables: { newKey: 'newValue' },
      });
      expect(mockModalManager.closeModal).toHaveBeenCalled();
    });

    it('should show alert when name is empty', async () => {
      const mockEvent = { preventDefault: jest.fn() } as any;

      mockModalManager.getFormData.mockReturnValue({
        name: '',
        status: AUTOMATION_STATUS.ENABLED,
        editable: true,
        startUrl: '',
        variables: {},
      });

      await controller.saveWebsite(mockEvent);

      expect(global.alert).toHaveBeenCalledWith('名前を入力してください');
      expect(mockSaveWebsiteWithAutomationVariablesUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle save error', async () => {
      controller.editingId = null;
      const mockEvent = { preventDefault: jest.fn() } as any;

      mockModalManager.getFormData.mockReturnValue({
        name: 'New Website',
        status: AUTOMATION_STATUS.ENABLED,
        editable: true,
        startUrl: 'https://new.com',
        variables: {},
      });

      mockSaveWebsiteWithAutomationVariablesUseCase.execute.mockRejectedValue(
        new Error('Save failed')
      );

      await controller.saveWebsite(mockEvent);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save website', expect.any(Error));
      expect(global.alert).toHaveBeenCalledWith('保存に失敗しました');
    });
  });

  describe('closeModal', () => {
    it('should close modal and reset editingId', () => {
      controller.editingId = 'website_1';

      controller.closeModal();

      expect(mockModalManager.closeModal).toHaveBeenCalled();
      expect(controller.editingId).toBeNull();
    });
  });

  describe('getModalManager', () => {
    it('should return modal manager instance', () => {
      const result = controller.getModalManager();

      expect(result).toBe(mockModalManager);
    });
  });
});
