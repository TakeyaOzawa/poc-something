/**
 * Unit Tests: AutomationVariablesManagerPresenter
 */

import {
  AutomationVariablesManagerPresenter,
  AutomationVariablesManagerView,
} from '../AutomationVariablesManagerPresenter';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByIdUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import { DuplicateAutomationVariablesUseCase } from '@usecases/automation-variables/DuplicateAutomationVariablesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { GetLatestAutomationResultUseCase } from '@usecases/automation-variables/GetLatestAutomationResultUseCase';
import { GetAutomationResultHistoryUseCase } from '@usecases/automation-variables/GetAutomationResultHistoryUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetLatestRecordingByVariablesIdUseCase } from '@usecases/recording/GetLatestRecordingByVariablesIdUseCase';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { NoOpLogger } from '@domain/services/NoOpLogger';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        automationVariablesLoadFailed: '変数の読み込みに失敗しました',
        automationVariablesSaved: '変数を保存しました',
        saveFailed: '保存に失敗しました',
        automationVariablesDeleted: '変数を削除しました',
        deleteFailed: '削除に失敗しました',
        automationVariablesDuplicated: '変数を複製しました',
        automationVariablesNotFound: '変数が見つかりませんでした',
        duplicateFailed: '複製に失敗しました',
        exportFailed: 'エクスポートに失敗しました',
        importCompleted: 'インポートが完了しました',
        unknownError: '不明なエラー',
        automationVariablesGetFailed: '変数の取得に失敗しました',
        resultHistoryLoadFailed: '実行履歴の読み込みに失敗しました',
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

describe('AutomationVariablesManagerPresenter', () => {
  let presenter: AutomationVariablesManagerPresenter;
  let mockView: jest.Mocked<AutomationVariablesManagerView>;
  let mockGetAllUseCase: jest.Mocked<GetAllAutomationVariablesUseCase>;
  let mockGetByIdUseCase: jest.Mocked<GetAutomationVariablesByIdUseCase>;
  let mockGetByWebsiteIdUseCase: jest.Mocked<GetAutomationVariablesByWebsiteIdUseCase>;
  let mockSaveUseCase: jest.Mocked<SaveAutomationVariablesUseCase>;
  let mockDeleteUseCase: jest.Mocked<DeleteAutomationVariablesUseCase>;
  let mockDuplicateUseCase: jest.Mocked<DuplicateAutomationVariablesUseCase>;
  let mockExportUseCase: jest.Mocked<ExportAutomationVariablesUseCase>;
  let mockImportUseCase: jest.Mocked<ImportAutomationVariablesUseCase>;
  let mockGetLatestResultUseCase: jest.Mocked<GetLatestAutomationResultUseCase>;
  let mockGetResultHistoryUseCase: jest.Mocked<GetAutomationResultHistoryUseCase>;
  let mockGetAllWebsitesUseCase: jest.Mocked<GetAllWebsitesUseCase>;
  let mockGetLatestRecordingByVariablesIdUseCase: jest.Mocked<GetLatestRecordingByVariablesIdUseCase>;

  beforeEach(() => {
    mockView = {
      showVariables: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showEmpty: jest.fn(),
      showRecordingPreview: jest.fn(),
      showNoRecordingMessage: jest.fn(),
    };

    mockGetAllUseCase = { execute: jest.fn() } as any;
    mockGetByIdUseCase = { execute: jest.fn() } as any;
    mockGetByWebsiteIdUseCase = { execute: jest.fn() } as any;
    mockSaveUseCase = { execute: jest.fn() } as any;
    mockDeleteUseCase = { execute: jest.fn() } as any;
    mockDuplicateUseCase = { execute: jest.fn() } as any;
    mockExportUseCase = { execute: jest.fn() } as any;
    mockImportUseCase = { execute: jest.fn() } as any;
    mockGetLatestResultUseCase = { execute: jest.fn() } as any;
    mockGetResultHistoryUseCase = { execute: jest.fn() } as any;
    mockGetAllWebsitesUseCase = { execute: jest.fn() } as any;
    mockGetLatestRecordingByVariablesIdUseCase = { execute: jest.fn() } as any;

    presenter = new AutomationVariablesManagerPresenter(
      mockView,
      mockGetAllUseCase,
      mockGetByIdUseCase,
      mockGetByWebsiteIdUseCase,
      mockSaveUseCase,
      mockDeleteUseCase,
      mockDuplicateUseCase,
      mockExportUseCase,
      mockImportUseCase,
      mockGetLatestResultUseCase,
      mockGetResultHistoryUseCase,
      mockGetAllWebsitesUseCase,
      mockGetLatestRecordingByVariablesIdUseCase,
      new NoOpLogger()
    );
  });

  describe('loadVariables', () => {
    it('should load and display all variables with latest results', async () => {
      const variables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: { username: 'test@example.com' },
        status: AUTOMATION_STATUS.ENABLED,
      });

      const result = AutomationResult.create({
        automationVariablesId: variables.getId(),
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'Success',
      });

      const websites = [
        {
          id: 'website-1',
          name: 'Test Website',
          editable: true,
          updatedAt: new Date().toISOString(),
        },
      ];

      mockGetAllUseCase.execute.mockResolvedValue({ automationVariables: [variables] });
      mockGetLatestResultUseCase.execute.mockResolvedValue({ result: result });
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({ success: true, websites: websites });

      await presenter.loadVariables();

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockGetAllUseCase.execute).toHaveBeenCalled();
      expect(mockGetAllWebsitesUseCase.execute).toHaveBeenCalled();
      expect(mockView.showVariables).toHaveBeenCalledWith([
        {
          ...variables.toData(),
          latestResult: result.toData(),
          websiteName: 'Test Website',
        },
      ]);
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should filter variables by websiteId', async () => {
      const variables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {},
      });

      const websites = [
        {
          id: 'website-1',
          name: 'Test Website',
          editable: true,
          updatedAt: new Date().toISOString(),
        },
      ];

      mockGetByWebsiteIdUseCase.execute.mockResolvedValue({ automationVariables: variables });
      mockGetLatestResultUseCase.execute.mockResolvedValue({ result: null });
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({ success: true, websites: websites });

      await presenter.loadVariables('website-1');

      expect(mockGetByWebsiteIdUseCase.execute).toHaveBeenCalledWith({ websiteId: 'website-1' });
      expect(mockGetAllWebsitesUseCase.execute).toHaveBeenCalled();
      expect(mockView.showVariables).toHaveBeenCalled();
    });

    it('should show empty when no variables found', async () => {
      mockGetAllUseCase.execute.mockResolvedValue({ automationVariables: [] });
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({ success: true, websites: [] });

      await presenter.loadVariables();

      expect(mockView.showEmpty).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle errors and show error message', async () => {
      mockGetAllUseCase.execute.mockRejectedValue(new Error('Failed'));
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({ success: true, websites: [] });

      await presenter.loadVariables();

      expect(mockView.showError).toHaveBeenCalledWith('変数の読み込みに失敗しました');
      expect(mockView.hideLoading).toHaveBeenCalled();
    });
  });

  describe('saveVariables', () => {
    it('should save variables and show success', async () => {
      const variables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {},
      });

      mockSaveUseCase.execute.mockResolvedValue({ automationVariables: variables });

      await presenter.saveVariables(variables);

      expect(mockSaveUseCase.execute).toHaveBeenCalledWith({ automationVariables: variables });
      expect(mockView.showSuccess).toHaveBeenCalledWith('変数を保存しました');
    });

    it('should handle errors and show error message', async () => {
      const variables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {},
      });

      mockSaveUseCase.execute.mockRejectedValue(new Error('Failed'));

      await expect(presenter.saveVariables(variables)).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('保存に失敗しました');
    });
  });

  describe('deleteVariables', () => {
    it('should delete variables and show success', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({ deleted: true });

      await presenter.deleteVariables('variables-1');

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith({ id: 'variables-1' });
      expect(mockView.showSuccess).toHaveBeenCalledWith('変数を削除しました');
    });

    it('should handle errors and show error message', async () => {
      mockDeleteUseCase.execute.mockRejectedValue(new Error('Failed'));

      await expect(presenter.deleteVariables('variables-1')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('削除に失敗しました');
    });
  });

  describe('duplicateVariables', () => {
    it('should duplicate variables and show success', async () => {
      const duplicate = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {},
      });

      mockDuplicateUseCase.execute.mockResolvedValue({ automationVariables: duplicate });

      await presenter.duplicateVariables('variables-1');

      expect(mockDuplicateUseCase.execute).toHaveBeenCalledWith({ id: 'variables-1' });
      expect(mockView.showSuccess).toHaveBeenCalledWith('変数を複製しました');
    });

    it('should show error when variables not found', async () => {
      mockDuplicateUseCase.execute.mockResolvedValue({ automationVariables: null });

      await presenter.duplicateVariables('variables-1');

      expect(mockView.showError).toHaveBeenCalledWith('変数が見つかりませんでした');
    });

    it('should handle errors and show error message', async () => {
      mockDuplicateUseCase.execute.mockRejectedValue(new Error('Failed'));

      await expect(presenter.duplicateVariables('variables-1')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('複製に失敗しました');
    });
  });

  describe('getVariablesById', () => {
    it('should return variables when found', async () => {
      const variables = AutomationVariables.create({
        websiteId: 'website-1',
        variables: {},
      });

      mockGetByIdUseCase.execute.mockResolvedValue({ automationVariables: variables });

      const result = await presenter.getVariablesById('variables-1');

      expect(result).toEqual(variables.toData());
    });

    it('should return null when variables not found', async () => {
      mockGetByIdUseCase.execute.mockResolvedValue({ automationVariables: null });

      const result = await presenter.getVariablesById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      mockGetByIdUseCase.execute.mockRejectedValue(new Error('Failed'));

      const result = await presenter.getVariablesById('variables-1');

      expect(result).toBeNull();
      expect(mockView.showError).toHaveBeenCalledWith('変数の取得に失敗しました');
    });
  });

  describe('exportVariables', () => {
    it('should export variables as CSV', async () => {
      const csvString = 'id,websiteId,variables\nvar-1,website-1,{}';
      mockExportUseCase.execute.mockResolvedValue({ csvText: csvString });

      const csv = await presenter.exportVariables();

      expect(mockExportUseCase.execute).toHaveBeenCalled();
      expect(csv).toBe(csvString);
    });

    it('should handle errors and show error message', async () => {
      mockExportUseCase.execute.mockRejectedValue(new Error('Failed'));

      await expect(presenter.exportVariables()).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('エクスポートに失敗しました');
    });
  });

  describe('importVariables', () => {
    it('should import variables from CSV and show success', async () => {
      const csvText = 'id,websiteId,variables\nvar-1,website-1,{}';
      mockImportUseCase.execute.mockResolvedValue({ success: true });

      await presenter.importVariables(csvText);

      expect(mockImportUseCase.execute).toHaveBeenCalledWith({ csvText });
      expect(mockView.showSuccess).toHaveBeenCalledWith('インポートが完了しました');
    });

    it('should handle errors and show error message with details', async () => {
      mockImportUseCase.execute.mockRejectedValue(new Error('Invalid CSV'));

      await expect(presenter.importVariables('invalid')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('インポートに失敗しました: Invalid CSV');
    });
  });

  describe('loadResultHistory', () => {
    it('should load result history for specific variables', async () => {
      const result1 = AutomationResult.create({
        automationVariablesId: 'variables-1',
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'First',
      });

      const result2 = AutomationResult.create({
        automationVariablesId: 'variables-1',
        executionStatus: EXECUTION_STATUS.FAILED,
        resultDetail: 'Second',
      });

      mockGetResultHistoryUseCase.execute.mockResolvedValue({ results: [result1, result2] });

      const history = await presenter.loadResultHistory('variables-1');

      expect(mockGetResultHistoryUseCase.execute).toHaveBeenCalledWith({
        automationVariablesId: 'variables-1',
      });
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(result1.toData());
      expect(history[1]).toEqual(result2.toData());
    });

    it('should return empty array on error', async () => {
      mockGetResultHistoryUseCase.execute.mockRejectedValue(new Error('Failed'));

      const history = await presenter.loadResultHistory('variables-1');

      expect(history).toEqual([]);
      expect(mockView.showError).toHaveBeenCalledWith('実行履歴の読み込みに失敗しました');
    });
  });
});
