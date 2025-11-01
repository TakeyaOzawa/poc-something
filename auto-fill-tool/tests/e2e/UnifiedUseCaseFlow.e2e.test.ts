/**
 * E2E Tests: UseCase出力型統一確認
 */

import { Result } from '@domain/values/result.value';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetAllXPathsUseCase } from '@usecases/xpaths/GetAllXPathsUseCase';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';

describe('E2E: UseCase出力型統一', () => {
  it('すべてのUseCaseがResult型を返すことを確認', async () => {
    // Mock repositories
    const mockWebsiteRepository = {
      load: jest.fn().mockResolvedValue(Result.success({ getAll: () => [] })),
      save: jest.fn(),
      loadByWebsiteId: jest.fn()
    };

    const mockXPathRepository = {
      load: jest.fn().mockResolvedValue(Result.success({ getAll: () => [] })),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn()
    };

    const mockAutomationVariablesRepository = {
      loadAll: jest.fn().mockResolvedValue(Result.success([])),
      save: jest.fn(),
      loadById: jest.fn(),
      loadByWebsiteId: jest.fn(),
      delete: jest.fn(),
      load: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn()
    };

    const mockSystemSettingsRepository = {
      load: jest.fn().mockResolvedValue(Result.success({
        getAll: () => [],
        createDefault: () => ({ retryWaitSecondsMin: 30 })
      })),
      save: jest.fn()
    };

    // Create UseCases
    const websiteUseCase = new GetAllWebsitesUseCase(mockWebsiteRepository as any);
    const xpathUseCase = new GetAllXPathsUseCase(mockXPathRepository as any);
    const variablesUseCase = new GetAllAutomationVariablesUseCase(mockAutomationVariablesRepository as any);
    const settingsUseCase = new GetSystemSettingsUseCase(mockSystemSettingsRepository as any);

    // Execute all UseCases
    const results = await Promise.all([
      websiteUseCase.execute(),
      xpathUseCase.execute(),
      variablesUseCase.execute(),
      settingsUseCase.execute()
    ]);

    // すべてのUseCaseがResult型を返すことを確認
    results.forEach(result => {
      expect(result).toHaveProperty('isSuccess');
      expect(result).toHaveProperty('isFailure');
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('error');
      expect(result.isSuccess).toBe(true);
    });
  });
});
