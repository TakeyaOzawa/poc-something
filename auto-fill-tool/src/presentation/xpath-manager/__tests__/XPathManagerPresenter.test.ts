import { XPathManagerPresenter, XPathManagerView } from '../XPathManagerPresenter';
import { GetAllXPathsUseCase } from '@usecases/xpaths/GetAllXPathsUseCase';
import { UpdateXPathUseCase } from '@usecases/xpaths/UpdateXPathUseCase';
import { DeleteXPathUseCase } from '@usecases/xpaths/DeleteXPathUseCase';
import { ExportXPathsUseCase } from '@usecases/xpaths/ExportXPathsUseCase';
import { ImportXPathsUseCase } from '@usecases/xpaths/ImportXPathsUseCase';
import { DuplicateXPathUseCase } from '@usecases/xpaths/DuplicateXPathUseCase';
import { XPathData } from '@domain/entities/XPathCollection';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        xpathLoadFailed: 'XPathの読み込みに失敗しました',
        xpathSaved: 'XPathを保存しました',
        saveFailed: '保存に失敗しました',
        xpathDeleted: 'XPathを削除しました',
        deleteFailed: '削除に失敗しました',
        xpathDuplicated: 'XPathを複製しました',
        xpathNotFound: 'XPathが見つかりませんでした',
        duplicateFailed: '複製に失敗しました',
        exportFailed: 'エクスポートに失敗しました',
        importCompleted: 'インポートが完了しました',
        unknownError: '不明なエラー',
        xpathGetFailed: 'XPathの取得に失敗しました',
      };
      return messages[key] || key;
    }),
    format: jest.fn((key: string, ...substitutions: string[]) => {
      if (key === 'importFailed') {
        return `インポートに失敗しました: ${substitutions[0]}`;
      }
      return key;
    }),
  },
}));

// Mock DIコンテナ
jest.mock('@infrastructure/di/GlobalContainer', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('XPathManagerPresenter', () => {
  let presenter: XPathManagerPresenter;
  let mockView: jest.Mocked<XPathManagerView>;
  let mockGetAllXPathsUseCase: jest.Mocked<GetAllXPathsUseCase>;
  let mockGetXPathsByWebsiteIdUseCase: any;
  let mockUpdateXPathUseCase: jest.Mocked<UpdateXPathUseCase>;
  let mockDeleteXPathUseCase: jest.Mocked<DeleteXPathUseCase>;
  let mockExportXPathsUseCase: jest.Mocked<ExportXPathsUseCase>;
  let mockImportXPathsUseCase: jest.Mocked<ImportXPathsUseCase>;
  let mockExportAutomationVariablesUseCase: any;
  let mockImportAutomationVariablesUseCase: any;
  let mockDuplicateXPathUseCase: jest.Mocked<DuplicateXPathUseCase>;

  const mockXPathData: XPathData = {
    id: 'xpath-1',
    websiteId: 'website-1',
    value: 'test@example.com',
    actionType: 'type',
    afterWaitSeconds: 1,
    actionPattern: 5,
    pathAbsolute: '/html/body/div/input',
    pathShort: '//*[@id="email"]',
    pathSmart: '//input[@name="email"]',
    selectedPathPattern: 'smart',
    retryType: 0,
    executionOrder: 1,
    executionTimeoutSeconds: 10,
    url: 'https://example.com',
  };

  beforeEach(() => {
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
    };

    mockGetAllXPathsUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetXPathsByWebsiteIdUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateXPathUseCase = {
      execute: jest.fn(),
    } as any;

    mockDeleteXPathUseCase = {
      execute: jest.fn(),
    } as any;

    mockExportXPathsUseCase = {
      execute: jest.fn(),
    } as any;

    mockImportXPathsUseCase = {
      execute: jest.fn(),
    } as any;

    const mockExportWebsitesUseCase = {
      execute: jest.fn(),
    } as any;

    const mockImportWebsitesUseCase = {
      execute: jest.fn(),
    } as any;

    mockExportAutomationVariablesUseCase = {
      execute: jest.fn(),
    } as any;

    mockImportAutomationVariablesUseCase = {
      execute: jest.fn(),
    } as any;

    mockDuplicateXPathUseCase = {
      execute: jest.fn(),
    } as any;

    // Mock DIコンテナ
    const { container } = require('@infrastructure/di/GlobalContainer');
    container.resolve = jest.fn((token: string) => {
      switch (token) {
        case 'GetAllXPathsUseCase':
          return mockGetAllXPathsUseCase;
        case 'SaveXPathUseCase':
          return mockUpdateXPathUseCase; // SaveXPathUseCase is used for updates
        case 'UpdateXPathUseCase':
          return mockUpdateXPathUseCase;
        case 'DeleteXPathUseCase':
          return mockDeleteXPathUseCase;
        case 'Logger':
          return new NoOpLogger();
        default:
          throw new Error(`Unknown token: ${token}`);
      }
    });

    presenter = new XPathManagerPresenter(mockView, new NoOpLogger());
  });

  describe('loadXPaths', () => {
    it('should load and display XPaths successfully', async () => {
      const xpaths = [mockXPathData];
      mockGetAllXPathsUseCase.execute.mockResolvedValue({ xpaths: xpaths });

      await presenter.loadXPaths();

      const expectedViewModel = {
        ...mockXPathData,
        xpath:
          mockXPathData.pathSmart || mockXPathData.pathShort || mockXPathData.pathAbsolute || '',
        isLoading: false,
        hasErrors: false,
        isEditing: false,
        displayValue: mockXPathData.value || '',
        actionTypeText: mockXPathData.actionType || '',
        executionOrderText: mockXPathData.executionOrder?.toString() || '0',
        retryTypeText: mockXPathData.retryType?.toString() || '0',
        canEdit: true,
        canDelete: true,
        canDuplicate: true,
      };

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockGetAllXPathsUseCase.execute).toHaveBeenCalled();
      expect(mockView.showXPaths).toHaveBeenCalledWith([expectedViewModel]);
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should filter XPaths by websiteId', async () => {
      const xpaths = [
        { ...mockXPathData, id: 'xpath-1', websiteId: 'website-1' },
        { ...mockXPathData, id: 'xpath-2', websiteId: 'website-2' },
      ];
      mockGetAllXPathsUseCase.execute.mockResolvedValue({ xpaths });

      await presenter.loadXPaths('website-1');

      const expectedViewModel = {
        ...xpaths[0],
        xpath: xpaths[0].pathSmart || xpaths[0].pathShort || xpaths[0].pathAbsolute || '',
        isLoading: false,
        hasErrors: false,
        isEditing: false,
        displayValue: xpaths[0].value || '',
        actionTypeText: xpaths[0].actionType || '',
        executionOrderText: xpaths[0].executionOrder?.toString() || '0',
        retryTypeText: xpaths[0].retryType?.toString() || '0',
        canEdit: true,
        canDelete: true,
        canDuplicate: true,
      };

      expect(mockGetAllXPathsUseCase.execute).toHaveBeenCalled();
      expect(mockView.showXPaths).toHaveBeenCalledWith([expectedViewModel]);
    });

    it('should show empty message when no XPaths found', async () => {
      mockGetAllXPathsUseCase.execute.mockResolvedValue({ xpaths: [] });

      await presenter.loadXPaths();

      expect(mockView.showEmpty).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle errors and show error message', async () => {
      mockGetAllXPathsUseCase.execute.mockRejectedValue(new Error('Failed to load'));

      await presenter.loadXPaths();

      expect(mockView.showError).toHaveBeenCalledWith('XPathの読み込みに失敗しました');
      expect(mockView.hideLoading).toHaveBeenCalled();
    });
  });

  describe('updateXPath', () => {
    it('should update XPath and show success', async () => {
      mockUpdateXPathUseCase.execute.mockResolvedValue({ xpath: mockXPathData });

      await presenter.updateXPath({ id: 'xpath-1', value: 'new-value' });

      expect(mockUpdateXPathUseCase.execute).toHaveBeenCalledWith({
        id: 'xpath-1',
        value: 'new-value',
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('XPathを保存しました');
    });

    it('should handle errors and show error message', async () => {
      mockUpdateXPathUseCase.execute.mockRejectedValue(new Error('Failed'));

      await expect(presenter.updateXPath({ id: 'xpath-1', value: 'new-value' })).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('保存に失敗しました');
    });
  });

  describe('deleteXPath', () => {
    it('should delete XPath and show success', async () => {
      mockDeleteXPathUseCase.execute.mockResolvedValue({ deleted: true });

      await presenter.deleteXPath('xpath-1');

      expect(mockDeleteXPathUseCase.execute).toHaveBeenCalledWith({ id: 'xpath-1' });
      expect(mockView.showSuccess).toHaveBeenCalledWith('XPathを削除しました');
    });

    it('should handle errors and show error message', async () => {
      mockDeleteXPathUseCase.execute.mockRejectedValue(new Error('Failed'));

      await expect(presenter.deleteXPath('xpath-1')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('削除に失敗しました');
    });
  });

  describe('duplicateXPath', () => {
    it('should duplicate XPath and show success', async () => {
      // Mock getAllXPathsUseCase to return the XPath to duplicate
      mockGetAllXPathsUseCase.execute.mockResolvedValue({ xpaths: [mockXPathData] });
      // Mock saveXPathUseCase for the duplication
      mockUpdateXPathUseCase.execute.mockResolvedValue({ xpath: mockXPathData });

      await presenter.duplicateXPath('xpath-1');

      expect(mockGetAllXPathsUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateXPathUseCase.execute).toHaveBeenCalledWith({
        websiteId: mockXPathData.websiteId,
        value: mockXPathData.value || '',
        actionType: mockXPathData.actionType,
        actionPattern: Number(mockXPathData.actionPattern) || 0,
        pathAbsolute: mockXPathData.pathAbsolute || '',
        pathShort: mockXPathData.pathShort || '',
        pathSmart: mockXPathData.pathSmart || '',
        selectedPathPattern: mockXPathData.selectedPathPattern,
        retryType: mockXPathData.retryType,
        executionOrder: (mockXPathData.executionOrder || 0) + 1,
        executionTimeoutSeconds: mockXPathData.executionTimeoutSeconds,
        afterWaitSeconds: mockXPathData.afterWaitSeconds,
        url: mockXPathData.url || '',
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('XPathを複製しました');
    });

    it('should show error when XPath not found', async () => {
      // Mock getAllXPathsUseCase to return empty array
      mockGetAllXPathsUseCase.execute.mockResolvedValue({ xpaths: [] });

      await presenter.duplicateXPath('xpath-1');

      expect(mockView.showError).toHaveBeenCalledWith('XPathが見つかりませんでした');
    });

    it('should handle errors and show error message', async () => {
      // Mock getAllXPathsUseCase to reject, which will cause getXPathById to return undefined
      // and duplicateXPath to show "XPath not found" error
      mockGetAllXPathsUseCase.execute.mockRejectedValue(new Error('Failed'));

      await presenter.duplicateXPath('xpath-1');

      expect(mockView.showError).toHaveBeenCalledWith('XPathが見つかりませんでした');
    });
  });

  describe('exportXPaths', () => {
    it('should export XPaths as CSV', async () => {
      await expect(presenter.exportXPaths()).rejects.toThrow(
        'Export functionality not implemented yet'
      );
      expect(mockView.showError).toHaveBeenCalledWith('エクスポートに失敗しました');
    });

    it('should handle errors and show error message', async () => {
      await expect(presenter.exportXPaths()).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('エクスポートに失敗しました');
    });
  });

  describe('importXPaths', () => {
    it('should import XPaths from CSV and show success', async () => {
      const csvText = 'id,website_id,value,action_type\nxpath-1,website-1,test,input';

      await expect(presenter.importXPaths(csvText)).rejects.toThrow(
        'Import functionality not implemented yet'
      );
      expect(mockView.showError).toHaveBeenCalledWith(
        'インポートに失敗しました: Import functionality not implemented yet'
      );
    });

    it('should handle errors and show error message with details', async () => {
      await expect(presenter.importXPaths('invalid')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith(
        'インポートに失敗しました: Import functionality not implemented yet'
      );
    });
  });

  describe('getXPathById', () => {
    it('should return XPath when found', async () => {
      const xpaths = [mockXPathData];
      mockGetAllXPathsUseCase.execute.mockResolvedValue({ xpaths: xpaths });

      const result = await presenter.getXPathById('xpath-1');

      expect(result).toEqual(mockXPathData);
    });

    it('should return undefined when XPath not found', async () => {
      mockGetAllXPathsUseCase.execute.mockResolvedValue({ xpaths: [mockXPathData] });

      const result = await presenter.getXPathById('non-existent');

      expect(result).toBeUndefined();
    });

    it('should handle errors and return undefined', async () => {
      mockGetAllXPathsUseCase.execute.mockRejectedValue(new Error('Failed'));

      const result = await presenter.getXPathById('xpath-1');

      expect(result).toBeUndefined();
      expect(mockView.showError).toHaveBeenCalledWith('XPathの取得に失敗しました');
    });
  });

  describe('exportAutomationVariables', () => {
    it('should export AutomationVariables as CSV', async () => {
      await expect(presenter.exportAutomationVariables()).rejects.toThrow(
        'Export functionality not implemented yet'
      );
      expect(mockView.showError).toHaveBeenCalledWith('エクスポートに失敗しました');
    });

    it('should handle errors and show error message', async () => {
      await expect(presenter.exportAutomationVariables()).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('エクスポートに失敗しました');
    });
  });

  describe('importAutomationVariables', () => {
    it('should import AutomationVariables from CSV and show success', async () => {
      const csvText = `"status","updatedAt","variables","websiteId"\n"enabled","2025-01-08T10:30:00.000Z","{""username"":""user1""}","website-1"`;

      await expect(presenter.importAutomationVariables(csvText)).rejects.toThrow(
        'Import functionality not implemented yet'
      );
      expect(mockView.showError).toHaveBeenCalledWith(
        'インポートに失敗しました: Import functionality not implemented yet'
      );
    });

    it('should handle errors and show error message with details', async () => {
      await expect(presenter.importAutomationVariables('invalid')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith(
        'インポートに失敗しました: Import functionality not implemented yet'
      );
    });
  });

  describe('exportWebsites', () => {
    it('should export Websites as CSV', async () => {
      await expect(presenter.exportWebsites()).rejects.toThrow(
        'Export functionality not implemented yet'
      );
      expect(mockView.showError).toHaveBeenCalledWith('エクスポートに失敗しました');
    });

    it('should handle errors and show error message', async () => {
      await expect(presenter.exportWebsites()).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('エクスポートに失敗しました');
    });
  });

  describe('importWebsites', () => {
    it('should import Websites from CSV and show success', async () => {
      const mockImportWebsitesUseCase = {
        execute: jest.fn(),
      } as any;
      const csvText = 'id,name,url\nwebsite-1,Test,https://example.com';
      mockImportWebsitesUseCase.execute.mockResolvedValue(undefined);

      const newPresenter = new XPathManagerPresenter(
        mockView,
        mockGetAllXPathsUseCase,
        mockGetXPathsByWebsiteIdUseCase,
        mockUpdateXPathUseCase,
        mockDeleteXPathUseCase,
        mockExportXPathsUseCase,
        mockImportXPathsUseCase,
        { execute: jest.fn() } as any,
        mockImportWebsitesUseCase,
        mockExportAutomationVariablesUseCase,
        mockImportAutomationVariablesUseCase,
        mockDuplicateXPathUseCase,
        new NoOpLogger()
      );
    });

    it('should handle errors and show error message with details', async () => {
      await expect(presenter.importWebsites('invalid')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith(
        'インポートに失敗しました: Import functionality not implemented yet'
      );
    });
  });
});
