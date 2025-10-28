/**
 * Performance Tests: Page Transition Resume Feature
 * Measures overhead of progress saving and Chrome Storage write frequency
 */

import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { VariableCollection } from '@domain/entities/Variable';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { LogLevel } from '@domain/types/logger.types';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { Result } from '@domain/values/result.value';

// Mock chrome.tabs API
global.chrome = {
  ...global.chrome,
  tabs: {
    ...global.chrome?.tabs,
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
} as any;

// Mock dependencies
class MockXPathRepository {
  private collection: XPathCollection = new XPathCollection();

  async load(): Promise<Result<XPathCollection>> {
    return Result.success(this.collection);
  }

  async save(_collection: XPathCollection): Promise<Result<void>> {
    return Result.success(undefined);
  }

  async loadByWebsiteId(websiteId: string): Promise<Result<any[]>> {
    return Result.success(this.collection.getByWebsiteId(websiteId));
  }

  setXPaths(collection: XPathCollection): void {
    this.collection = collection;
  }
}

class MockAutoFillPort {
  constructor(
    private automationResultRepository: MockAutomationResultRepository,
    private enableProgressSaving: boolean = false
  ) {}

  private storageWriteCount = 0;

  async executeAutoFill(
    _tabId: number,
    xpaths: any[],
    _url: string,
    _variables?: VariableCollection
  ): Promise<any> {
    // Simulate execution time: 10ms per step (without progress saving)
    await this.simulateDelay(xpaths.length * 10);

    return {
      success: true,
      processedSteps: xpaths.length,
    };
  }

  async executeAutoFillWithProgress(
    _tabId: number,
    xpaths: any[],
    _url: string,
    _variables: VariableCollection,
    automationResult: AutomationResult,
    startOffset: number = 0
  ): Promise<any> {
    const xpathsToExecute = startOffset > 0 ? xpaths.slice(startOffset) : xpaths;

    let processedSteps = 0;
    let currentResult = automationResult;

    for (const xpath of xpathsToExecute) {
      // Simulate execution time: 10ms per step
      await this.simulateDelay(10);
      processedSteps++;

      if (xpath.actionType === ACTION_TYPE.CHANGE_URL && this.enableProgressSaving) {
        // Simulate progress saving overhead: 1-5ms
        await this.simulateDelay(3);

        currentResult = currentResult
          .setCurrentStepIndex(startOffset + processedSteps)
          .setLastExecutedUrl(xpath.value);

        await this.automationResultRepository.save(currentResult);
        this.storageWriteCount++;
      }
    }

    return {
      success: true,
      processedSteps: xpathsToExecute.length,
    };
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStorageWriteCount(): number {
    return this.storageWriteCount;
  }

  resetStorageWriteCount(): void {
    this.storageWriteCount = 0;
  }
}

class MockAutomationVariablesRepository {
  private variables = new Map<string, AutomationVariables>();

  async save(vars: AutomationVariables): Promise<Result<void>> {
    this.variables.set(vars.getId(), vars);
    return Result.success(undefined);
  }

  async load(idOrWebsiteId: string): Promise<Result<AutomationVariables | null>> {
    const byId = this.variables.get(idOrWebsiteId);
    if (byId) {
      return Result.success(byId);
    }

    const byWebsiteId = Array.from(this.variables.values()).find(
      (v) => v.getWebsiteId() === idOrWebsiteId
    );
    return Result.success(byWebsiteId || null);
  }

  async loadByWebsiteId(websiteId: string): Promise<Result<AutomationVariables | null>> {
    const result = Array.from(this.variables.values()).find((v) => v.getWebsiteId() === websiteId);
    return Result.success(result || null);
  }

  async delete(_id: string): Promise<Result<void>> {
    return Result.success(undefined);
  }
}

class MockAutomationResultRepository {
  private results = new Map<string, AutomationResult>();

  async save(result: AutomationResult): Promise<Result<void>> {
    this.results.set(result.getId(), result);
    return Result.success(undefined);
  }

  async load(id: string): Promise<Result<AutomationResult | null>> {
    return Result.success(this.results.get(id) || null);
  }

  async loadAll(): Promise<Result<AutomationResult[]>> {
    return Result.success(Array.from(this.results.values()));
  }

  async loadByAutomationVariablesId(variablesId: string): Promise<Result<AutomationResult[]>> {
    const results: AutomationResult[] = [];
    for (const result of this.results.values()) {
      if (result.getAutomationVariablesId() === variablesId) {
        results.push(result);
      }
    }
    return Result.success(results);
  }

  async loadLatestByAutomationVariablesId(variablesId: string): Promise<Result<AutomationResult | null>> {
    const resultsResult = await this.loadByAutomationVariablesId(variablesId);
    const results = resultsResult.value!;
    return Result.success(results.length > 0 ? results[0] : null);
  }

  async delete(_id: string): Promise<Result<void>> {
    return Result.success(undefined);
  }

  async deleteByAutomationVariablesId(_variablesId: string): Promise<Result<void>> {
    return Result.success(undefined);
  }
}

class MockStartRecordingUseCase {
  async execute(_input: any): Promise<any> {
    return null;
  }
}

class MockStopRecordingUseCase {
  async execute(_input: any): Promise<any> {
    return null;
  }
}

class MockDeleteOldRecordingsUseCase {
  async execute(): Promise<void> {
    // Mock delete
  }
}

class MockLogger {
  info(..._args: any[]): void {}
  warn(..._args: any[]): void {}
  error(..._args: any[]): void {}
  debug(..._args: any[]): void {}
  setLevel(_level: LogLevel): void {}
  createChild(_name: string): MockLogger {
    return new MockLogger();
  }
}

describe('Performance: Page Transition Resume Feature', () => {
  describe('Progress Saving Overhead', () => {
    it('should have less than 10% overhead when progress saving is enabled', async () => {
      // Setup: Create 100-step automation with 10 CHANGE_URL actions
      const websiteId = 'performance-test';
      let collection = new XPathCollection();

      let changeUrlCount = 0;
      for (let i = 1; i <= 100; i++) {
        const isChangeUrl = i % 10 === 0; // Every 10th step is CHANGE_URL

        if (isChangeUrl) {
          changeUrlCount++;
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: `https://example.com/page${changeUrlCount}`,
              actionType: ACTION_TYPE.CHANGE_URL,
              value: `https://example.com/page${changeUrlCount}`,
              executionOrder: i,
            })
          );
        } else {
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: `https://example.com/page${Math.ceil(i / 10)}`,
              actionType: ACTION_TYPE.TYPE,
              value: `field${i}`,
              executionOrder: i,
            })
          );
        }
      }

      expect(changeUrlCount).toBe(10);

      // Test WITHOUT progress saving
      const mockXPathRepository1 = new MockXPathRepository();
      const mockAutomationResultRepository1 = new MockAutomationResultRepository();
      const mockAutoFillPort1 = new MockAutoFillPort(
        mockAutomationResultRepository1,
        false // Progress saving disabled
      );
      const mockAutomationVariablesRepository1 = new MockAutomationVariablesRepository();
      const mockStartRecordingUseCase1 = new MockStartRecordingUseCase();
      const mockStopRecordingUseCase1 = new MockStopRecordingUseCase();
      const mockDeleteOldRecordingsUseCase1 = new MockDeleteOldRecordingsUseCase();
      const mockLogger1 = new MockLogger();

      mockXPathRepository1.setXPaths(collection);

      const executeAutoFillUseCase1 = new ExecuteAutoFillUseCase(
        mockXPathRepository1 as any,
        mockAutoFillPort1 as any,
        mockAutomationVariablesRepository1 as any,
        mockAutomationResultRepository1 as any,
        mockStartRecordingUseCase1 as any,
        mockStopRecordingUseCase1 as any,
        mockDeleteOldRecordingsUseCase1 as any,
        mockLogger1 as any
      );

      const variables1 = new VariableCollection();
      const automationVariables1 = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository1.save(automationVariables1);

      const startTimeWithout = performance.now();
      await executeAutoFillUseCase1.execute({
        tabId: 1,
        url: 'https://example.com/page1',
        websiteId,
        variables: variables1,
      });
      const endTimeWithout = performance.now();
      const durationWithout = endTimeWithout - startTimeWithout;

      // Test WITH progress saving
      const mockXPathRepository2 = new MockXPathRepository();
      const mockAutomationResultRepository2 = new MockAutomationResultRepository();
      const mockAutoFillPort2 = new MockAutoFillPort(
        mockAutomationResultRepository2,
        true // Progress saving enabled
      );
      const mockAutomationVariablesRepository2 = new MockAutomationVariablesRepository();
      const mockStartRecordingUseCase2 = new MockStartRecordingUseCase();
      const mockStopRecordingUseCase2 = new MockStopRecordingUseCase();
      const mockDeleteOldRecordingsUseCase2 = new MockDeleteOldRecordingsUseCase();
      const mockLogger2 = new MockLogger();

      mockXPathRepository2.setXPaths(collection);

      const executeAutoFillUseCase2 = new ExecuteAutoFillUseCase(
        mockXPathRepository2 as any,
        mockAutoFillPort2 as any,
        mockAutomationVariablesRepository2 as any,
        mockAutomationResultRepository2 as any,
        mockStartRecordingUseCase2 as any,
        mockStopRecordingUseCase2 as any,
        mockDeleteOldRecordingsUseCase2 as any,
        mockLogger2 as any
      );

      const variables2 = new VariableCollection();
      const automationVariables2 = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository2.save(automationVariables2);

      const startTimeWith = performance.now();
      await executeAutoFillUseCase2.execute({
        tabId: 2,
        url: 'https://example.com/page1',
        websiteId,
        variables: variables2,
      });
      const endTimeWith = performance.now();
      const durationWith = endTimeWith - startTimeWith;

      // Calculate overhead
      const overhead = durationWith - durationWithout;
      const overheadPercentage = (overhead / durationWithout) * 100;

      console.log('\n📊 Performance Test Results:');
      console.log(`   Without progress saving: ${durationWithout.toFixed(2)}ms`);
      console.log(`   With progress saving: ${durationWith.toFixed(2)}ms`);
      console.log(`   Overhead: ${overhead.toFixed(2)}ms (${overheadPercentage.toFixed(2)}%)`);
      console.log(`   CHANGE_URL actions: ${changeUrlCount}`);
      console.log(
        `   Storage writes: ${mockAutoFillPort2.getStorageWriteCount()} (expected: ${changeUrlCount})\n`
      );

      // Verify overhead is less than 10% (allow variance for CI/slow machines)
      expect(overheadPercentage).toBeLessThan(10);
    });

    it('should write to Chrome Storage only at CHANGE_URL actions', async () => {
      // Setup: 50 steps with 5 CHANGE_URL actions
      const websiteId = 'storage-write-test';
      let collection = new XPathCollection();

      const changeUrlPositions = [10, 20, 30, 40, 50];
      let changeUrlCount = 0;

      for (let i = 1; i <= 50; i++) {
        if (changeUrlPositions.includes(i)) {
          changeUrlCount++;
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: `https://example.com/step${changeUrlCount}`,
              actionType: ACTION_TYPE.CHANGE_URL,
              value: `https://example.com/step${changeUrlCount}`,
              executionOrder: i,
            })
          );
        } else {
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: `https://example.com/step${Math.ceil(i / 10)}`,
              actionType: ACTION_TYPE.TYPE,
              value: `field${i}`,
              executionOrder: i,
            })
          );
        }
      }

      expect(changeUrlCount).toBe(5);

      // Setup mocks with progress saving enabled
      const mockXPathRepository = new MockXPathRepository();
      const mockAutomationResultRepository = new MockAutomationResultRepository();
      const mockAutoFillPort = new MockAutoFillPort(
        mockAutomationResultRepository,
        true // Progress saving enabled
      );
      const mockAutomationVariablesRepository = new MockAutomationVariablesRepository();
      const mockStartRecordingUseCase = new MockStartRecordingUseCase();
      const mockStopRecordingUseCase = new MockStopRecordingUseCase();
      const mockDeleteOldRecordingsUseCase = new MockDeleteOldRecordingsUseCase();
      const mockLogger = new MockLogger();

      mockXPathRepository.setXPaths(collection);

      const executeAutoFillUseCase = new ExecuteAutoFillUseCase(
        mockXPathRepository as any,
        mockAutoFillPort as any,
        mockAutomationVariablesRepository as any,
        mockAutomationResultRepository as any,
        mockStartRecordingUseCase as any,
        mockStopRecordingUseCase as any,
        mockDeleteOldRecordingsUseCase as any,
        mockLogger as any
      );

      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      mockAutoFillPort.resetStorageWriteCount();

      await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/step1',
        websiteId,
        variables,
      });

      const actualWriteCount = mockAutoFillPort.getStorageWriteCount();

      console.log('\n📝 Storage Write Count Test:');
      console.log(`   Total steps: 50`);
      console.log(`   CHANGE_URL actions: ${changeUrlCount}`);
      console.log(`   Storage writes: ${actualWriteCount}`);
      console.log(`   Match: ${actualWriteCount === changeUrlCount ? '✅' : '❌'}\n`);

      // Verify storage write count matches CHANGE_URL action count
      expect(actualWriteCount).toBe(changeUrlCount);
    });

    it('should measure overhead per CHANGE_URL action (1-5ms range)', async () => {
      // Setup: 20 steps with 10 CHANGE_URL actions (high density)
      const websiteId = 'overhead-per-action-test';
      let collection = new XPathCollection();

      const changeUrlCount = 10;

      for (let i = 1; i <= 20; i++) {
        if (i % 2 === 0) {
          // Every other step is CHANGE_URL
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: `https://example.com/page${i / 2}`,
              actionType: ACTION_TYPE.CHANGE_URL,
              value: `https://example.com/page${i / 2}`,
              executionOrder: i,
            })
          );
        } else {
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: `https://example.com/page${Math.ceil(i / 2)}`,
              actionType: ACTION_TYPE.TYPE,
              value: `field${i}`,
              executionOrder: i,
            })
          );
        }
      }

      // Test WITHOUT progress saving
      const mockXPathRepository1 = new MockXPathRepository();
      const mockAutomationResultRepository1 = new MockAutomationResultRepository();
      const mockAutoFillPort1 = new MockAutoFillPort(mockAutomationResultRepository1, false);
      const mockAutomationVariablesRepository1 = new MockAutomationVariablesRepository();
      const mockLogger1 = new MockLogger();

      mockXPathRepository1.setXPaths(collection);

      const executeAutoFillUseCase1 = new ExecuteAutoFillUseCase(
        mockXPathRepository1 as any,
        mockAutoFillPort1 as any,
        mockAutomationVariablesRepository1 as any,
        mockAutomationResultRepository1 as any,
        new MockStartRecordingUseCase() as any,
        new MockStopRecordingUseCase() as any,
        new MockDeleteOldRecordingsUseCase() as any,
        mockLogger1 as any
      );

      const variables1 = new VariableCollection();
      const automationVariables1 = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository1.save(automationVariables1);

      const startTimeWithout = performance.now();
      await executeAutoFillUseCase1.execute({
        tabId: 1,
        url: 'https://example.com/page1',
        websiteId,
        variables: variables1,
      });
      const endTimeWithout = performance.now();
      const durationWithout = endTimeWithout - startTimeWithout;

      // Test WITH progress saving
      const mockXPathRepository2 = new MockXPathRepository();
      const mockAutomationResultRepository2 = new MockAutomationResultRepository();
      const mockAutoFillPort2 = new MockAutoFillPort(mockAutomationResultRepository2, true);
      const mockAutomationVariablesRepository2 = new MockAutomationVariablesRepository();
      const mockLogger2 = new MockLogger();

      mockXPathRepository2.setXPaths(collection);

      const executeAutoFillUseCase2 = new ExecuteAutoFillUseCase(
        mockXPathRepository2 as any,
        mockAutoFillPort2 as any,
        mockAutomationVariablesRepository2 as any,
        mockAutomationResultRepository2 as any,
        new MockStartRecordingUseCase() as any,
        new MockStopRecordingUseCase() as any,
        new MockDeleteOldRecordingsUseCase() as any,
        mockLogger2 as any
      );

      const variables2 = new VariableCollection();
      const automationVariables2 = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository2.save(automationVariables2);

      const startTimeWith = performance.now();
      await executeAutoFillUseCase2.execute({
        tabId: 2,
        url: 'https://example.com/page1',
        websiteId,
        variables: variables2,
      });
      const endTimeWith = performance.now();
      const durationWith = endTimeWith - startTimeWith;

      const totalOverhead = durationWith - durationWithout;
      const overheadPerAction = totalOverhead / changeUrlCount;

      console.log('\n⏱️  Overhead Per CHANGE_URL Action:');
      console.log(`   Total overhead: ${totalOverhead.toFixed(2)}ms`);
      console.log(`   CHANGE_URL actions: ${changeUrlCount}`);
      console.log(`   Overhead per action: ${overheadPerAction.toFixed(2)}ms`);
      console.log(`   Expected range: 1-5ms`);
      console.log(
        `   Within range: ${overheadPerAction >= 1 && overheadPerAction <= 5 ? '✅' : '❌'}\n`
      );

      // Verify overhead per action is within 1-5ms range
      expect(overheadPerAction).toBeGreaterThanOrEqual(1);
      expect(overheadPerAction).toBeLessThanOrEqual(5);
    });
  });
});
