/**
 * ExecuteAutoFillUseCase Tests
 */

import { ExecuteAutoFillUseCase } from '../ExecuteAutoFillUseCase';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationResult } from '@domain/entities/AutomationResult';

// インターフェースを実装から取得
import type {
  XPathRepository,
  AutomationVariablesRepository,
  AutomationResultRepository,
  AutoFillService
} from '../ExecuteAutoFillUseCase';

describe('ExecuteAutoFillUseCase', () => {
  let useCase: ExecuteAutoFillUseCase;
  let mockXPathRepository: jest.Mocked<XPathRepository>;
  let mockVariablesRepository: jest.Mocked<AutomationVariablesRepository>;
  let mockResultRepository: jest.Mocked<AutomationResultRepository>;
  let mockAutoFillService: jest.Mocked<AutoFillService>;

  beforeEach(() => {
    mockXPathRepository = {
      getAll: jest.fn(),
      loadByWebsiteId: jest.fn()
    };

    mockVariablesRepository = {
      getById: jest.fn()
    };

    mockResultRepository = {
      save: jest.fn(),
      loadInProgress: jest.fn()
    };

    mockAutoFillService = {
      executeAutoFillWithProgress: jest.fn()
    };

    useCase = new ExecuteAutoFillUseCase(
      mockXPathRepository,
      mockVariablesRepository,
      mockResultRepository,
      mockAutoFillService
    );
  });

  describe('execute', () => {
    test('自動入力が正常に実行されること', async () => {
      // Arrange
      const automationVariablesId = 'vars-1';
      const variables = AutomationVariables.create({
        id: automationVariablesId,
        websiteId: 'website-1',
        variables: [{ name: 'username', value: 'testuser' }]
      });

      const xpathCollection = XPathCollection.fromData([{
        id: 'xpath-item-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0,
        smartXPath: '//input'
      }]);

      mockVariablesRepository.getById.mockResolvedValue(variables);
      mockResultRepository.loadInProgress.mockResolvedValue([]);
      mockXPathRepository.loadByWebsiteId.mockResolvedValue(xpathCollection);
      mockAutoFillService.executeAutoFillWithProgress.mockResolvedValue();

      // Act
      const result = await useCase.execute(automationVariablesId);

      // Assert
      expect(result).toBeDefined();
      expect(mockVariablesRepository.getById).toHaveBeenCalledWith(automationVariablesId);
      expect(mockXPathRepository.loadByWebsiteId).toHaveBeenCalledWith(variables.getWebsiteId());
      expect(mockResultRepository.save).toHaveBeenCalled();
      expect(mockAutoFillService.executeAutoFillWithProgress).toHaveBeenCalled();
    });

    test('変数が見つからない場合、エラーが返されること', async () => {
      // Arrange
      const automationVariablesId = 'vars-1';
      mockVariablesRepository.getById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute(automationVariablesId)).rejects.toThrow('自動化変数が見つかりません');
    });

    test('XPathが見つからない場合、エラーが返されること', async () => {
      // Arrange
      const automationVariablesId = 'vars-1';
      const variables = AutomationVariables.create({
        id: automationVariablesId,
        websiteId: 'website-1',
        variables: []
      });

      const emptyXPathCollection = XPathCollection.create();

      mockVariablesRepository.getById.mockResolvedValue(variables);
      mockResultRepository.loadInProgress.mockResolvedValue([]);
      mockXPathRepository.loadByWebsiteId.mockResolvedValue(emptyXPathCollection);

      // Act & Assert
      await expect(useCase.execute(automationVariablesId)).rejects.toThrow('XPath設定が見つかりません');
    });

    test('実行中の処理がある場合、継続実行されること', async () => {
      // Arrange
      const automationVariablesId = 'vars-1';
      const variables = AutomationVariables.create({
        id: automationVariablesId,
        websiteId: 'website-1',
        variables: []
      });

      const inProgressResult = AutomationResult.create('vars-1', 'website-1', 5);

      const xpathCollection = XPathCollection.fromData([{
        id: 'xpath-item-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0,
        smartXPath: '//input'
      }]);

      mockVariablesRepository.getById.mockResolvedValue(variables);
      mockResultRepository.loadInProgress.mockResolvedValue([inProgressResult]);
      mockXPathRepository.loadByWebsiteId.mockResolvedValue(xpathCollection);
      mockAutoFillService.executeAutoFillWithProgress.mockResolvedValue();

      // Act
      const result = await useCase.execute(automationVariablesId);

      // Assert
      expect(result).toBe(inProgressResult);
      expect(mockAutoFillService.executeAutoFillWithProgress).toHaveBeenCalledWith(
        xpathCollection,
        variables,
        inProgressResult
      );
    });

    test('24時間以上前の実行中処理は無視されること', async () => {
      // Arrange
      const automationVariablesId = 'vars-1';
      const variables = AutomationVariables.create({
        id: automationVariablesId,
        websiteId: 'website-1',
        variables: []
      });

      // 25時間前の実行結果を作成
      const oldResult = AutomationResult.create('vars-1', 'website-1', 5);
      // startedAtを25時間前に設定
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      (oldResult as any).data.startedAt = twentyFiveHoursAgo.toISOString();

      const xpathCollection = XPathCollection.fromData([{
        id: 'xpath-item-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0,
        smartXPath: '//input'
      }]);

      mockVariablesRepository.getById.mockResolvedValue(variables);
      mockResultRepository.loadInProgress.mockResolvedValue([oldResult]);
      mockXPathRepository.loadByWebsiteId.mockResolvedValue(xpathCollection);
      mockAutoFillService.executeAutoFillWithProgress.mockResolvedValue();

      // Act
      const result = await useCase.execute(automationVariablesId);

      // Assert
      expect(result).not.toBe(oldResult); // 新しい実行結果が作成される
      expect(mockResultRepository.save).toHaveBeenCalled(); // 新規保存が実行される
    });
  });
});
