/**
 * Integration Tests: Page Transition Resume Feature
 * Tests the complete page transition and resume workflow
 */

import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { AutomationResult, AutomationResultData } from '@domain/entities/AutomationResult';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
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
    // Mock save
    return Result.success(undefined);
  }

  async loadByWebsiteId(websiteId: string): Promise<Result<XPathData[], Error>> {
    return Result.success(this.collection.getByWebsiteId(websiteId));
  }

  // Test helper
  setXPaths(collection: XPathCollection): void {
    this.collection = collection;
  }
}

class MockAutoFillPort {
  constructor(private automationResultRepository: MockAutomationResultRepository) {}

  async executeAutoFill(
    _tabId: number,
    xpaths: any[],
    _url: string,
    _variables?: VariableCollection
  ): Promise<any> {
    // Mock successful execution
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
    // Apply startOffset to skip already-processed steps (like real ChromeAutoFillAdapter line 445)
    const xpathsToExecute = startOffset > 0 ? xpaths.slice(startOffset) : xpaths;

    // Simulate progress saving after CHANGE_URL actions
    let processedSteps = 0;
    let currentResult = automationResult;

    for (const xpath of xpathsToExecute) {
      processedSteps++;

      // Save progress after CHANGE_URL action (like real ChromeAutoFillAdapter line 500-501)
      if (xpath.actionType === ACTION_TYPE.CHANGE_URL) {
        currentResult = currentResult
          .setCurrentStepIndex(startOffset + processedSteps)
          .setLastExecutedUrl(xpath.value);
        await this.automationResultRepository.save(currentResult);
      }
    }

    // Mock successful execution with progress
    return {
      success: true,
      processedSteps: xpathsToExecute.length,
    };
  }
}

class MockAutomationVariablesRepository {
  private variables = new Map<string, AutomationVariables>();

  async save(vars: AutomationVariables): Promise<Result<void>> {
    this.variables.set(vars.getId(), vars);
    return Result.success(undefined);
  }

  async load(idOrWebsiteId: string): Promise<Result<AutomationVariables | null>> {
    // Search by ID first
    const byId = this.variables.get(idOrWebsiteId);
    if (byId) {
      return Result.success(byId);
    }

    // Search by websiteId (like the real repository does)
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
    // Mock delete
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

  async loadByStatus(status: string): Promise<Result<AutomationResult[]>> {
    const results = Array.from(this.results.values()).filter(
      (r) => r.getExecutionStatus() === status
    );
    return Result.success(results);
  }

  async loadInProgress(websiteId?: string): Promise<Result<AutomationResult[]>> {
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;

    let filtered = Array.from(this.results.values()).filter((r) => {
      if (r.getExecutionStatus() !== 'doing') return false;
      const age = now - new Date(r.getStartFrom()).getTime();
      return age < twentyFourHoursMs;
    });

    if (websiteId) {
      filtered = filtered.filter((r) => r.getAutomationVariablesId() === websiteId);
    }

    return Result.success(filtered);
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
    if (resultsResult.isFailure) {
      return Result.failure(resultsResult.error!);
    }
    const results = resultsResult.value!;
    return Result.success(results.length > 0 ? results[0] : null);
  }

  async delete(_id: string): Promise<Result<void>> {
    // Mock delete
    return Result.success(undefined);
  }

  async deleteByAutomationVariablesId(_variablesId: string): Promise<Result<void>> {
    // Mock delete
    return Result.success(undefined);
  }

  // Test helper
  getResultCount(): number {
    return this.results.size;
  }
}

class MockStartRecordingUseCase {
  async execute(_input: any): Promise<any> {
    return null; // Recording disabled for these tests
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

describe('Page Transition Resume Integration Tests', () => {
  let mockXPathRepository: MockXPathRepository;
  let mockAutoFillPort: MockAutoFillPort;
  let mockAutomationVariablesRepository: MockAutomationVariablesRepository;
  let mockAutomationResultRepository: MockAutomationResultRepository;
  let mockStartRecordingUseCase: MockStartRecordingUseCase;
  let mockStopRecordingUseCase: MockStopRecordingUseCase;
  let mockDeleteOldRecordingsUseCase: MockDeleteOldRecordingsUseCase;
  let mockLogger: MockLogger;

  let executeAutoFillUseCase: ExecuteAutoFillUseCase;

  beforeEach(() => {
    mockXPathRepository = new MockXPathRepository();
    mockAutomationResultRepository = new MockAutomationResultRepository();
    mockAutoFillPort = new MockAutoFillPort(mockAutomationResultRepository);
    mockAutomationVariablesRepository = new MockAutomationVariablesRepository();
    mockStartRecordingUseCase = new MockStartRecordingUseCase();
    mockStopRecordingUseCase = new MockStopRecordingUseCase();
    mockDeleteOldRecordingsUseCase = new MockDeleteOldRecordingsUseCase();
    mockLogger = new MockLogger();

    executeAutoFillUseCase = new ExecuteAutoFillUseCase(
      mockXPathRepository as any,
      mockAutoFillPort as any,
      mockAutomationVariablesRepository as any,
      mockAutomationResultRepository as any,
      mockStartRecordingUseCase as any,
      mockStopRecordingUseCase as any,
      mockDeleteOldRecordingsUseCase as any,
      mockLogger as any
    );
  });

  describe('Task 4.2: New Execution', () => {
    it('should create AutomationResult in DOING status when starting new execution', async () => {
      // Arrange - Setup XPath data with 5 steps
      const websiteId = 'test-website-1';
      let collection = new XPathCollection();

      // Add 5 XPath steps
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page1',
          pathSmart: '//input[@name="username"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'username',
          executionOrder: 1,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page1',
          pathSmart: '//input[@name="password"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'password',
          executionOrder: 2,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page1',
          pathSmart: '//button[@type="submit"]',
          actionType: ACTION_TYPE.CLICK,
          value: '',
          executionOrder: 3,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page2',
          pathSmart: '//a[@href="/next"]',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: '',
          executionOrder: 4,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page2',
          pathSmart: '//input[@name="email"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'email',
          executionOrder: 5,
        })
      );

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables (required for AutomationResult creation)
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Act - Execute auto-fill (new execution)
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/page1',
        websiteId,
        variables,
      });

      // Assert - Execution completed successfully
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBeGreaterThan(0);

      // Assert - AutomationResult was created and saved
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const automationResult = allResults[0];

      // Task 4.2 Requirement 1: AutomationResult was created with SUCCESS status
      expect(automationResult.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);

      // Task 4.2 Requirement 2: currentStepIndex set to processedSteps on successful completion
      // After fix to finalizeExecution(), successful executions set currentStepIndex = processedSteps
      expect(automationResult.getCurrentStepIndex()).toBe(5);

      // Task 4.2 Requirement 3: totalSteps matches XPath data length
      expect(automationResult.getTotalSteps()).toBe(5);
    });

    it('should save AutomationVariables with correct websiteId', async () => {
      // Arrange
      const websiteId = 'test-website-2';
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/form',
          pathSmart: '//input[@name="field1"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'field1',
        })
      );

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Act
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/form',
        websiteId,
        variables,
      });

      // Assert
      expect(result.success).toBe(true);

      // Check AutomationResult references AutomationVariables
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const automationResult = allResults[0];
      const variablesId = automationResult.getAutomationVariablesId();
      expect(variablesId).toBeDefined();

      // Check AutomationVariables was saved
      const savedVariablesResult = await mockAutomationVariablesRepository.load(variablesId);
      expect(savedVariablesResult.isSuccess).toBe(true);
      const savedVariables = savedVariablesResult.value;
      expect(savedVariables).not.toBeNull();
      expect(savedVariables!.getWebsiteId()).toBe(websiteId);
    });

    it('should initialize progress tracking fields correctly', async () => {
      // Arrange
      const websiteId = 'test-website-3';
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step1',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 1,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step2',
          actionType: ACTION_TYPE.CHANGE_URL,
          executionOrder: 2,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step2',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 3,
        })
      );

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Act
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/step1',
        websiteId,
        variables,
      });

      // Assert
      expect(result.success).toBe(true);

      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const automationResult = allResults[0];

      // Check progress fields after successful execution
      // After fix to finalizeExecution(), currentStepIndex set to processedSteps (3)
      expect(automationResult.getCurrentStepIndex()).toBe(3);
      expect(automationResult.getTotalSteps()).toBe(3);
      // Mock service saves lastExecutedUrl during CHANGE_URL action (step 2, default value "Test Value")
      expect(automationResult.getLastExecutedUrl()).toBe('Test Value');

      // Check execution timestamps
      expect(automationResult.getStartFrom()).toBeDefined();
      // Note: Status is SUCCESS because mock completes immediately, so endTo is set
      expect(automationResult.getEndTo()).toBeDefined();
    });

    it('should calculate progress percentage correctly', async () => {
      // Arrange
      const websiteId = 'test-website-4';
      let collection = new XPathCollection();

      // Add 10 XPath steps
      for (let i = 0; i < 10; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/page',
            actionType: ACTION_TYPE.TYPE,
            value: `field${i}`,
            executionOrder: i + 1,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Act
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/page',
        websiteId,
        variables,
      });

      // Assert
      expect(result.success).toBe(true);

      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      const automationResult = allResults[0];

      // After successful completion, currentStepIndex = 10, totalSteps = 10
      // Progress: 10/10 = 100%
      expect(automationResult.getCurrentStepIndex()).toBe(10);
      expect(automationResult.getTotalSteps()).toBe(10);
      expect(automationResult.getProgressPercentage()).toBe(100);
    });
  });

  describe('Task 4.3: CHANGE_URL Progress Saving', () => {
    it('should save progress after CHANGE_URL action', async () => {
      // Arrange - Setup XPath data with CHANGE_URL step
      const websiteId = 'test-website-5';
      let collection = new XPathCollection();

      // Add steps including CHANGE_URL
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page1',
          pathSmart: '//input[@name="username"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'testuser',
          executionOrder: 1,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page1',
          pathSmart: '//button[@type="submit"]',
          actionType: ACTION_TYPE.CLICK,
          value: '',
          executionOrder: 2,
        })
      );

      // CHANGE_URL action to page2
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page2',
          pathSmart: '',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/page2',
          executionOrder: 3,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/page2',
          pathSmart: '//input[@name="email"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'test@example.com',
          executionOrder: 4,
        })
      );

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Act - Execute auto-fill
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/page1',
        websiteId,
        variables,
      });

      // Assert - Execution completed
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(4);

      // Assert - Progress was saved after CHANGE_URL
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBeGreaterThan(0);

      const automationResult = allResults[0];

      // Task 4.3 Requirement: lastExecutedUrl updated to CHANGE_URL value (preserved from saveProgress)
      expect(automationResult.getLastExecutedUrl()).toBe('https://example.com/page2');

      // Note: currentStepIndex is set to processedSteps (4) on successful completion
      // But during execution, it was saved as 3 after CHANGE_URL
      expect(automationResult.getCurrentStepIndex()).toBe(4);
    });

    it('should save progress multiple times for multiple CHANGE_URL actions', async () => {
      // Arrange - Setup XPath data with multiple CHANGE_URL steps
      const websiteId = 'test-website-6';
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step1',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 1,
        })
      );

      // First CHANGE_URL
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step2',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/step2',
          executionOrder: 2,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step2',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 3,
        })
      );

      // Second CHANGE_URL
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step3',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/step3',
          executionOrder: 4,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/step3',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 5,
        })
      );

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Act
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/step1',
        websiteId,
        variables,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(5);

      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      const automationResult = allResults[0];

      // After successful completion, currentStepIndex = 5 (all steps)
      // But lastExecutedUrl is preserved from last CHANGE_URL at step 4
      expect(automationResult.getCurrentStepIndex()).toBe(5);
      expect(automationResult.getLastExecutedUrl()).toBe('https://example.com/step3');
    });

    it('should calculate correct progress percentage after CHANGE_URL', async () => {
      // Arrange
      const websiteId = 'test-website-7';
      let collection = new XPathCollection();

      // Create 10 steps with CHANGE_URL at step 5
      for (let i = 1; i <= 10; i++) {
        if (i === 5) {
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: 'https://example.com/page2',
              actionType: ACTION_TYPE.CHANGE_URL,
              value: 'https://example.com/page2',
              executionOrder: i,
            })
          );
        } else {
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: i <= 5 ? 'https://example.com/page1' : 'https://example.com/page2',
              actionType: ACTION_TYPE.TYPE,
              executionOrder: i,
            })
          );
        }
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Act
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/page1',
        websiteId,
        variables,
      });

      // Assert
      expect(result.success).toBe(true);

      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      const automationResult = allResults[0];

      // After successful completion, all 10 steps are marked complete
      // CHANGE_URL at step 5 saved intermediate progress, but finalizeExecution sets to 10
      expect(automationResult.getCurrentStepIndex()).toBe(10);
      expect(automationResult.getTotalSteps()).toBe(10);

      // Progress after completion: 10/10 = 100%
      expect(automationResult.getProgressPercentage()).toBe(100);
    });
  });

  describe('Task 4.4: Resume Execution', () => {
    it('should resume execution from currentStepIndex when DOING status exists', async () => {
      // Arrange - Setup XPath data with 10 steps
      const websiteId = 'test-website-8';
      let collection = new XPathCollection();

      // Add 10 XPath steps
      for (let i = 1; i <= 10; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/page',
            actionType: i === 5 ? ACTION_TYPE.CHANGE_URL : ACTION_TYPE.TYPE,
            value: i === 5 ? 'https://example.com/page2' : `field${i}`,
            executionOrder: i,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Create existing DOING AutomationResult at step 5
      const existingResult = AutomationResult.create({
        automationVariablesId: automationVariables.getWebsiteId(),
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'In progress',
        currentStepIndex: 5,
        totalSteps: 10,
        lastExecutedUrl: 'https://example.com/page2',
      });
      await mockAutomationResultRepository.save(existingResult);

      // Act - Execute auto-fill (should resume from step 5)
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/page',
        websiteId,
        variables,
      });

      // Assert - Execution resumed and completed successfully
      expect(result.success).toBe(true);
      // Should process remaining 5 steps (6-10)
      expect(result.processedSteps).toBe(5);

      // Assert - AutomationResult was updated to SUCCESS
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1); // Only one result (existing one updated)

      const updatedResult = allResults[0];
      expect(updatedResult.getId()).toBe(existingResult.getId()); // Same ID as existing

      // Task 4.4 Requirement: Execution resumed from step 5 and completed
      expect(updatedResult.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(updatedResult.getCurrentStepIndex()).toBe(10); // All steps completed
      expect(updatedResult.getTotalSteps()).toBe(10);
    });

    it('should only resume executions within 24 hours', async () => {
      // Arrange - Setup XPath data
      const websiteId = 'test-website-9';
      let collection = new XPathCollection();

      for (let i = 1; i <= 5; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/form',
            actionType: ACTION_TYPE.TYPE,
            executionOrder: i,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Create old DOING result (25 hours ago - should be ignored)
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      const oldResultData = {
        id: 'old-result-id',
        automationVariablesId: automationVariables.getWebsiteId(),
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'Old in progress',
        startFrom: oldDate, // 25 hours ago
        endTo: null,
        currentStepIndex: 2,
        totalSteps: 5,
        lastExecutedUrl: '',
      };
      const oldResult = new AutomationResult(oldResultData);
      await mockAutomationResultRepository.save(oldResult);

      // Act - Execute auto-fill (should start new execution, not resume old one)
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/form',
        websiteId,
        variables,
      });

      // Assert - New execution started (all 5 steps processed)
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(5);

      // Assert - New AutomationResult was created
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(2); // Old result + new result

      // Find the new result (the one with SUCCESS status)
      const newResult = allResults.find((r) => r.getExecutionStatus() === EXECUTION_STATUS.SUCCESS);
      expect(newResult).toBeDefined();
      expect(newResult!.getCurrentStepIndex()).toBe(5); // All steps completed from start
    });

    it('should only resume executions with matching websiteId', async () => {
      // Arrange - Setup XPath data for websiteId 'test-website-10'
      const targetWebsiteId = 'test-website-10';
      const otherWebsiteId = 'test-website-other';

      let collection = new XPathCollection();
      for (let i = 1; i <= 5; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId: targetWebsiteId,
            url: 'https://example.com/target',
            actionType: ACTION_TYPE.TYPE,
            executionOrder: i,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables for target website
      const targetVariables = AutomationVariables.create({
        websiteId: targetWebsiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(targetVariables);

      // Setup AutomationVariables for other website
      const otherVariables = AutomationVariables.create({
        websiteId: otherWebsiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(otherVariables);

      // Create DOING result for OTHER website
      const otherResult = AutomationResult.create({
        automationVariablesId: otherVariables.getWebsiteId(),
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'Other in progress',
        currentStepIndex: 2,
        totalSteps: 5,
        lastExecutedUrl: '',
      });
      await mockAutomationResultRepository.save(otherResult);

      // Act - Execute auto-fill for TARGET website
      const variables = new VariableCollection();
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/target',
        websiteId: targetWebsiteId,
        variables,
      });

      // Assert - New execution started (not resumed from other website)
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(5); // All steps from start

      // Assert - New AutomationResult was created for target website
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(2); // Other result + new target result

      // Find target website result
      const targetResult = allResults.find(
        (r) =>
          r.getAutomationVariablesId() === targetVariables.getWebsiteId() &&
          r.getExecutionStatus() === EXECUTION_STATUS.SUCCESS
      );
      expect(targetResult).toBeDefined();
      expect(targetResult!.getCurrentStepIndex()).toBe(5); // All steps completed from start
    });

    it('should handle case when currentStepIndex exceeds total steps', async () => {
      // Arrange - Setup XPath data with 5 steps
      const websiteId = 'test-website-11';
      let collection = new XPathCollection();

      for (let i = 1; i <= 5; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/complete',
            actionType: ACTION_TYPE.TYPE,
            executionOrder: i,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Create DOING result with currentStepIndex=10 (exceeds totalSteps=5)
      const existingResult = AutomationResult.create({
        automationVariablesId: automationVariables.getWebsiteId(),
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'Stalled execution',
        currentStepIndex: 10,
        totalSteps: 5,
        lastExecutedUrl: '',
      });
      await mockAutomationResultRepository.save(existingResult);

      // Act - Execute auto-fill (should mark as completed without processing)
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/complete',
        websiteId,
        variables,
      });

      // Assert - Marked as completed with 0 steps processed
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(0); // No steps to process

      // Assert - AutomationResult was marked as SUCCESS
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const updatedResult = allResults[0];
      expect(updatedResult.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(updatedResult.getCurrentStepIndex()).toBe(5); // Set to totalSteps
    });
  });

  describe('Task 4.5: Edge Cases', () => {
    it('should start new execution when checkExistingExecution fails', async () => {
      // Arrange - Setup XPath data
      const websiteId = 'test-website-12';
      let collection = new XPathCollection();

      for (let i = 1; i <= 3; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/form',
            actionType: ACTION_TYPE.TYPE,
            executionOrder: i,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables
      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Mock loadAll to throw error (simulating repository failure)
      const originalLoadAll = mockAutomationResultRepository.loadAll.bind(
        mockAutomationResultRepository
      );
      mockAutomationResultRepository.loadAll = jest
        .fn()
        .mockRejectedValueOnce(new Error('Database connection failed'))
        .mockImplementation(originalLoadAll);

      // Act - Execute auto-fill (should start new execution despite error)
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/form',
        websiteId,
        variables,
      });

      // Assert - New execution started successfully
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(3);
    });

    it('should continue execution even when AutomationResult save fails', async () => {
      // Arrange
      const websiteId = 'test-website-13';
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/test',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 1,
        })
      );

      mockXPathRepository.setXPaths(collection);

      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Mock save to fail on second call (finalizeExecution)
      const originalSave = mockAutomationResultRepository.save.bind(mockAutomationResultRepository);
      let saveCallCount = 0;
      mockAutomationResultRepository.save = jest.fn().mockImplementation(async (result) => {
        saveCallCount++;
        if (saveCallCount === 2) {
          // Second call (finalizeExecution) fails
          throw new Error('Save failed - disk full');
        }
        return originalSave(result);
      });

      // Act - Execute auto-fill
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/test',
        websiteId,
        variables,
      });

      // Assert - Execution completed successfully despite save failure
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
      expect(saveCallCount).toBe(2);
    });

    it('should execute successfully when AutomationVariables not found', async () => {
      // Arrange - Setup XPath data without AutomationVariables
      const websiteId = 'test-website-14';
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/simple',
          actionType: ACTION_TYPE.TYPE,
          value: 'test',
          executionOrder: 1,
        })
      );

      mockXPathRepository.setXPaths(collection);

      // Don't create AutomationVariables - repository returns Result with null
      mockAutomationVariablesRepository.load = jest.fn().mockResolvedValue(Result.success(null));

      // Act
      const variables = new VariableCollection();
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/simple',
        websiteId,
        variables,
      });

      // Assert - Execution succeeds without AutomationResult tracking
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);

      // AutomationResult should not be created
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(0);
    });

    it('should handle repository errors gracefully during resume check', async () => {
      // Arrange
      const websiteId = 'test-website-15';
      let collection = new XPathCollection();

      for (let i = 1; i <= 5; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/multi',
            actionType: ACTION_TYPE.TYPE,
            executionOrder: i,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Create DOING result
      const existingResult = AutomationResult.create({
        automationVariablesId: automationVariables.getWebsiteId(),
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'In progress',
        currentStepIndex: 2,
        totalSteps: 5,
        lastExecutedUrl: '',
      });
      await mockAutomationResultRepository.save(existingResult);

      // Mock load to fail when trying to load AutomationVariables during resume check
      const originalLoadVars = mockAutomationVariablesRepository.load.bind(
        mockAutomationVariablesRepository
      );
      let loadCallCount = 0;
      mockAutomationVariablesRepository.load = jest.fn().mockImplementation(async (id) => {
        loadCallCount++;
        if (loadCallCount === 1) {
          // First call (resume check) fails
          throw new Error('Network timeout');
        }
        return originalLoadVars(id);
      });

      // Act - Should start new execution after resume check fails
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/multi',
        websiteId,
        variables,
      });

      // Assert - Resumed execution completed successfully
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(3); // Steps 3-5 (resumed from step 2)
    });

    it('should handle AutomationResult load failure in finalizeExecution', async () => {
      // Arrange
      const websiteId = 'test-website-16';
      let collection = new XPathCollection();

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/reload',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 1,
        })
      );

      mockXPathRepository.setXPaths(collection);

      const variables = new VariableCollection();
      const automationVariables = AutomationVariables.create({
        websiteId,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVariables);

      // Mock load to fail during finalizeExecution
      const originalLoad = mockAutomationResultRepository.load.bind(mockAutomationResultRepository);
      mockAutomationResultRepository.load = jest.fn().mockRejectedValue(new Error('Read failed'));

      // Act
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/reload',
        websiteId,
        variables,
      });

      // Assert - Execution succeeds despite reload failure
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(1);
    });
  });
});
