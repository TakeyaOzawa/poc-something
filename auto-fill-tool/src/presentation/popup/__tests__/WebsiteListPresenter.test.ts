/**
 * Unit Tests: WebsiteListPresenter
 */

import { WebsiteListPresenter } from '../WebsiteListPresenter';
import { ModalManager } from '../ModalManager';
import { WebsiteActionHandler } from '../WebsiteActionHandler';
import { ApplicationService } from '@infrastructure/di/ApplicationService';

// Mock dependencies
jest.mock('../ModalManager');
jest.mock('../WebsiteActionHandler');
jest.mock('@infrastructure/di/ApplicationService');
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

// Mock DIコンテナ
jest.mock('@infrastructure/di/GlobalContainer', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

describe('WebsiteListPresenter', () => {
  let controller: WebsiteListPresenter;
  let mockModalManager: jest.Mocked<ModalManager>;
  let mockActionHandler: jest.Mocked<WebsiteActionHandler>;
  let mockApplicationService: jest.Mocked<ApplicationService>;

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
      executeWebsite: jest.fn().mockResolvedValue(true),
    } as any;

    mockApplicationService = {
      executeCommand: jest.fn(),
      createLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn().mockReturnThis(),
      }),
    } as any;

    // Mock ApplicationService
    (ApplicationService as jest.MockedClass<typeof ApplicationService>).mockImplementation(
      () => mockApplicationService
    );

    // Setup ApplicationService command responses
    mockApplicationService.executeCommand.mockImplementation((command: string) => {
      switch (command) {
        case 'GetAllWebsites':
          return Promise.resolve({ websites: [] });
        case 'GetAllAutomationVariables':
          return Promise.resolve({ automationVariables: [] });
        default:
          return Promise.resolve({});
      }
    });

    controller = new WebsiteListPresenter(mockModalManager, mockActionHandler);

    // Mock global functions
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create instance', () => {
    expect(controller).toBeDefined();
  });

  describe('loadAndRender', () => {
    it('should load and render websites', async () => {
      await controller.loadAndRender();

      expect(mockApplicationService.executeCommand).toHaveBeenCalledWith('GetAllWebsites');
      expect(mockApplicationService.executeCommand).toHaveBeenCalledWith(
        'GetAllAutomationVariables'
      );
    });
  });

  describe('getModalManager', () => {
    it('should return modal manager instance', () => {
      const result = controller.getModalManager();

      expect(result).toBe(mockModalManager);
    });
  });
});
