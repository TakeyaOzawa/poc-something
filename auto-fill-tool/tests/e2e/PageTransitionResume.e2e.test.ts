/**
 * E2E Tests: Page Transition Resume Feature
 * Tests the complete end-to-end flow of auto-fill with page transitions and automatic resume
 */

import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { AutomationResult } from '@domain/entities/AutomationResult';
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

// Mock dependencies (reusing patterns from page-transition-resume.integration.test.ts)
class MockXPathRepository {
  private collection: XPathCollection = new XPathCollection();

  async load(): Promise<Result<XPathCollection>> {
    return Result.success(this.collection);
  }

  async save(_collection: XPathCollection): Promise<Result<void>> {
    return Result.success(undefined);
  }

  async loadByWebsiteId(websiteId: string): Promise<Result<XPathData[], Error>> {
    return Result.success(this.collection.getByWebsiteId(websiteId));
  }

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
      processedSteps++;

      if (xpath.actionType === ACTION_TYPE.CHANGE_URL) {
        currentResult = currentResult
          .setCurrentStepIndex(startOffset + processedSteps)
          .setLastExecutedUrl(xpath.value);
        await this.automationResultRepository.save(currentResult);
      }
    }

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
    const results = resultsResult.value!;
    return Result.success(results.length > 0 ? results[0] : null);
  }

  async delete(_id: string): Promise<Result<void>> {
    return Result.success(undefined);
  }

  async deleteByAutomationVariablesId(_variablesId: string): Promise<Result<void>> {
    return Result.success(undefined);
  }

  getResultCount(): number {
    return this.results.size;
  }

  loadInProgressFromBatch(
    _batchData: any,
    websiteId?: string
  ): Result<AutomationResult[], Error> {
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

describe('E2E: Page Transition Resume Feature', () => {
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
      undefined, // batchStorageLoader (optional)
      mockLogger as any
    );
  });

  describe('Complete Multi-Page Form Workflow', () => {
    it('should complete 3-page form with automatic resume on each page transition', async () => {
      // Setup: Create XPath data for 3-page form scenario
      const websiteId = 'multi-page-registration';
      let collection = new XPathCollection();

      // Page 1: Personal Information (4 steps)
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step1',
          pathSmart: '//input[@id="firstName"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'John',
          executionOrder: 1,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step1',
          pathSmart: '//input[@id="lastName"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'Doe',
          executionOrder: 2,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step1',
          pathSmart: '//input[@id="email"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'john.doe@example.com',
          executionOrder: 3,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step1',
          pathSmart: '//button[@id="nextBtn"]',
          actionType: ACTION_TYPE.CLICK,
          value: '',
          executionOrder: 4,
        })
      );

      // CHANGE_URL action to Page 2 (step 5)
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step2',
          pathSmart: '',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/register/step2',
          executionOrder: 5,
        })
      );

      // Page 2: Address Information (5 steps)
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step2',
          pathSmart: '//input[@id="street"]',
          actionType: ACTION_TYPE.TYPE,
          value: '123 Main St',
          executionOrder: 6,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step2',
          pathSmart: '//input[@id="city"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'San Francisco',
          executionOrder: 7,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step2',
          pathSmart: '//input[@id="state"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'CA',
          executionOrder: 8,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step2',
          pathSmart: '//input[@id="zipCode"]',
          actionType: ACTION_TYPE.TYPE,
          value: '94105',
          executionOrder: 9,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step2',
          pathSmart: '//button[@id="nextBtn"]',
          actionType: ACTION_TYPE.CLICK,
          value: '',
          executionOrder: 10,
        })
      );

      // CHANGE_URL action to Page 3 (step 11)
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step3',
          pathSmart: '',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/register/step3',
          executionOrder: 11,
        })
      );

      // Page 3: Finalize (4 steps)
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step3',
          pathSmart: '//input[@id="username"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'johndoe123',
          executionOrder: 12,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step3',
          pathSmart: '//input[@id="password"]',
          actionType: ACTION_TYPE.TYPE,
          value: 'SecurePass123!',
          executionOrder: 13,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step3',
          pathSmart: '//input[@id="terms"]',
          actionType: ACTION_TYPE.CLICK,
          value: '',
          executionOrder: 14,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/register/step3',
          pathSmart: '//button[@id="submitBtn"]',
          actionType: ACTION_TYPE.CLICK,
          value: '',
          executionOrder: 15,
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

      // Phase 1: Execute on Page 1 (steps 1-5)
      const page1Result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/register/step1',
        websiteId,
        variables,
      });

      // Verify Page 1 execution succeeded
      expect(page1Result.success).toBe(true);
      expect(page1Result.processedSteps).toBe(15); // All steps processed initially

      // Verify progress was saved after CHANGE_URL at step 5
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const automationResult = allResults[0];
      expect(automationResult.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(automationResult.getCurrentStepIndex()).toBe(15); // Completed all steps
      expect(automationResult.getTotalSteps()).toBe(15);
      expect(automationResult.getLastExecutedUrl()).toBe('https://example.com/register/step3'); // Last CHANGE_URL

      // Verify all 15 steps were completed in single execution
      expect(automationResult.getProgressPercentage()).toBe(100);
    });

    it('should resume from Page 2 if Page 1 was partially completed', async () => {
      // Setup: Create XPath data with CHANGE_URL after Page 1
      const websiteId = 'resume-from-page2';
      let collection = new XPathCollection();

      // Page 1: 3 steps
      for (let i = 1; i <= 3; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/form/page1',
            actionType: ACTION_TYPE.TYPE,
            value: `field${i}`,
            executionOrder: i,
          })
        );
      }

      // CHANGE_URL to Page 2 (step 4)
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/form/page2',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/form/page2',
          executionOrder: 4,
        })
      );

      // Page 2: 3 steps
      for (let i = 5; i <= 7; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: 'https://example.com/form/page2',
            actionType: ACTION_TYPE.TYPE,
            value: `field${i}`,
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

      // Create existing DOING result stopped at step 4 (after CHANGE_URL)
      const existingResult = AutomationResult.create({
        automationVariablesId: websiteId, // Use websiteId, not UUID
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'Paused at page transition',
        currentStepIndex: 4,
        totalSteps: 7,
        lastExecutedUrl: 'https://example.com/form/page2',
      });
      await mockAutomationResultRepository.save(existingResult);

      // Execute on Page 2 (should resume from step 4)
      const resumeResult = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/form/page2',
        websiteId,
        variables,
      });

      // Verify resume succeeded
      expect(resumeResult.success).toBe(true);
      expect(resumeResult.processedSteps).toBe(3); // Steps 5-7 (remaining steps)

      // Verify AutomationResult was updated
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const updatedResult = allResults[0];
      expect(updatedResult.getId()).toBe(existingResult.getId());
      expect(updatedResult.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(updatedResult.getCurrentStepIndex()).toBe(7); // All steps completed
      expect(updatedResult.getTotalSteps()).toBe(7);
    });

    it('should handle interruption at Page 2 and resume at Page 3', async () => {
      // Setup: 3-page form with interruption simulation
      const websiteId = 'interrupted-flow';
      let collection = new XPathCollection();

      // Page 1: 2 steps + CHANGE_URL
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step1',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 1,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step1',
          actionType: ACTION_TYPE.CLICK,
          executionOrder: 2,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step2',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/wizard/step2',
          executionOrder: 3,
        })
      );

      // Page 2: 2 steps + CHANGE_URL
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step2',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 4,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step2',
          actionType: ACTION_TYPE.CLICK,
          executionOrder: 5,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step3',
          actionType: ACTION_TYPE.CHANGE_URL,
          value: 'https://example.com/wizard/step3',
          executionOrder: 6,
        })
      );

      // Page 3: 2 final steps
      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step3',
          actionType: ACTION_TYPE.TYPE,
          executionOrder: 7,
        })
      );

      collection = collection.add(
        createTestXPathData({
          websiteId,
          url: 'https://example.com/wizard/step3',
          actionType: ACTION_TYPE.CLICK,
          executionOrder: 8,
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

      // Simulate interruption: AutomationResult stopped at step 6 (after reaching Page 3)
      const interruptedResult = AutomationResult.create({
        automationVariablesId: websiteId, // Use websiteId, not UUID
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'User closed tab at page 2->3 transition',
        currentStepIndex: 6,
        totalSteps: 8,
        lastExecutedUrl: 'https://example.com/wizard/step3',
      });
      await mockAutomationResultRepository.save(interruptedResult);

      // Resume on Page 3 (steps 7-8)
      const resumeResult = await executeAutoFillUseCase.execute({
        tabId: 2, // Different tab (simulating user reopened)
        url: 'https://example.com/wizard/step3',
        websiteId,
        variables,
      });

      // Verify resume succeeded
      expect(resumeResult.success).toBe(true);
      expect(resumeResult.processedSteps).toBe(2); // Steps 7-8

      // Verify final state
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const finalResult = allResults[0];
      expect(finalResult.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(finalResult.getCurrentStepIndex()).toBe(8);
      expect(finalResult.getTotalSteps()).toBe(8);
      expect(finalResult.getProgressPercentage()).toBe(100);
    });

    it('should not resume if websiteId does not match', async () => {
      // Setup: Two different websites
      const websiteId1 = 'site-a';
      const websiteId2 = 'site-b';

      let collection = new XPathCollection();

      // Site A XPaths
      for (let i = 1; i <= 5; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId: websiteId1,
            url: 'https://site-a.com/form',
            actionType: ACTION_TYPE.TYPE,
            executionOrder: i,
          })
        );
      }

      // Site B XPaths
      for (let i = 1; i <= 5; i++) {
        collection = collection.add(
          createTestXPathData({
            websiteId: websiteId2,
            url: 'https://site-b.com/form',
            actionType: ACTION_TYPE.TYPE,
            executionOrder: i,
          })
        );
      }

      mockXPathRepository.setXPaths(collection);

      // Setup AutomationVariables for both sites
      const variables = new VariableCollection();

      const automationVars1 = AutomationVariables.create({
        websiteId: websiteId1,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVars1);

      const automationVars2 = AutomationVariables.create({
        websiteId: websiteId2,
        variables: {},
      });
      await mockAutomationVariablesRepository.save(automationVars2);

      // Create DOING result for Site A
      const siteAResult = AutomationResult.create({
        automationVariablesId: websiteId1, // Use websiteId, not UUID
        executionStatus: EXECUTION_STATUS.DOING,
        resultDetail: 'Site A in progress',
        currentStepIndex: 3,
        totalSteps: 5,
        lastExecutedUrl: 'https://site-a.com/form',
      });
      await mockAutomationResultRepository.save(siteAResult);

      // Execute on Site B (should NOT resume Site A's execution)
      const siteBResult = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://site-b.com/form',
        websiteId: websiteId2,
        variables,
      });

      // Verify Site B started new execution (not resumed)
      expect(siteBResult.success).toBe(true);
      expect(siteBResult.processedSteps).toBe(5); // All 5 steps from start

      // Verify 2 AutomationResults exist (Site A DOING, Site B SUCCESS)
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(2);

      const siteAFinal = allResults.find(
        (r) => r.getAutomationVariablesId() === websiteId1
      );
      const siteBFinal = allResults.find(
        (r) => r.getAutomationVariablesId() === websiteId2
      );

      // Site A should still be DOING at step 3
      expect(siteAFinal?.getExecutionStatus()).toBe(EXECUTION_STATUS.DOING);
      expect(siteAFinal?.getCurrentStepIndex()).toBe(3);

      // Site B should be SUCCESS with all steps
      expect(siteBFinal?.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(siteBFinal?.getCurrentStepIndex()).toBe(5);
    });

    it('should handle rapid page transitions without losing progress', async () => {
      // Setup: 5-page wizard with minimal steps per page
      const websiteId = 'rapid-transitions';
      let collection = new XPathCollection();

      for (let page = 1; page <= 5; page++) {
        // 1 action per page
        collection = collection.add(
          createTestXPathData({
            websiteId,
            url: `https://example.com/wizard/page${page}`,
            actionType: ACTION_TYPE.TYPE,
            value: `page${page}`,
            executionOrder: page * 2 - 1,
          })
        );

        // CHANGE_URL to next page (except on last page)
        if (page < 5) {
          collection = collection.add(
            createTestXPathData({
              websiteId,
              url: `https://example.com/wizard/page${page + 1}`,
              actionType: ACTION_TYPE.CHANGE_URL,
              value: `https://example.com/wizard/page${page + 1}`,
              executionOrder: page * 2,
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

      // Execute complete workflow
      const result = await executeAutoFillUseCase.execute({
        tabId: 1,
        url: 'https://example.com/wizard/page1',
        websiteId,
        variables,
      });

      // Verify all steps completed successfully
      expect(result.success).toBe(true);
      expect(result.processedSteps).toBe(9); // 5 TYPE + 4 CHANGE_URL actions

      // Verify final state
      const allResultsResult = await mockAutomationResultRepository.loadAll();
      expect(allResultsResult.isSuccess).toBe(true);
      const allResults = allResultsResult.value!;
      expect(allResults.length).toBe(1);

      const finalResult = allResults[0];
      expect(finalResult.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(finalResult.getCurrentStepIndex()).toBe(9);
      expect(finalResult.getTotalSteps()).toBe(9);

      // Verify progress was saved at each CHANGE_URL (lastExecutedUrl should be final page)
      expect(finalResult.getLastExecutedUrl()).toBe('https://example.com/wizard/page5');
    });
  });
});
