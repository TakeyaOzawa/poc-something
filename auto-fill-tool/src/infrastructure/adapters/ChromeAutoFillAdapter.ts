/* eslint-disable max-lines */
/**
 * Infrastructure Layer: Chrome Auto-Fill Adapter
 * Adapts Chrome extension APIs for auto-fill sequence execution
 *
 * This adapter delegates action execution to specialized executor classes
 * and business logic to domain services.
 *
 * @coverage 85.46%
 * @reason テストカバレッジが低い理由:
 * - 無限リトライモードを含む複雑なリトライループ、複数のキャンセルチェックポイント、
 *   タイムアウト処理の全ての組み合わせをテストするのは困難
 * - Promise.raceを使用したタイムアウト制御（実行、タイムアウト、キャンセルの3つの
 *   競合するPromise）は、テスト環境での正確な再現が難しい
 * - 100msごとのキャンセルチェック、変数置換の有無、未知のアクションタイプなど、
 *   多数のエッジケースと条件分岐が存在
 * - 現在のテストでは主要な実行フローをカバーしており、
 *   全てのエッジケースの完全なカバレッジには追加実装が必要
 */

import { AutoFillPort, AutoFillResult } from '@domain/types/auto-fill-port.types';
import { XPathData } from '@domain/entities/XPathCollection';
import { VariableCollection } from '@domain/entities/Variable';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { ProgressReporter } from '../auto-fill/ProgressReporter';
import { InputActionExecutor } from '../auto-fill/InputActionExecutor';
import { ClickActionExecutor } from '../auto-fill/ClickActionExecutor';
import { CheckboxActionExecutor } from '../auto-fill/CheckboxActionExecutor';
import { JudgeActionExecutor } from '../auto-fill/JudgeActionExecutor';
import { SelectActionExecutor } from '../auto-fill/SelectActionExecutor';
import { ChangeUrlActionExecutor } from '../auto-fill/ChangeUrlActionExecutor';
import { ScreenshotActionExecutor } from '../auto-fill/ScreenshotActionExecutor';
import {
  GetValueActionExecutor,
  GetValueExecutionResult,
} from '../auto-fill/GetValueActionExecutor';
import { XPathSelectionService } from '@domain/services/XPathSelectionService';
import { RetryController } from '../auto-fill/RetryController';
import { TimeoutManager } from '../auto-fill/TimeoutManager';
import { CancellationCoordinator } from '../auto-fill/CancellationCoordinator';

export class ChromeAutoFillAdapter implements AutoFillPort {
  // Track active executions by tabId to prevent concurrent executions
  private static activeExecutions: Map<number, boolean> = new Map();
  private messageDispatcher: MessageDispatcher;
  private progressReporter: ProgressReporter;

  // Action executors (delegation pattern)
  private inputExecutor: InputActionExecutor;
  private clickExecutor: ClickActionExecutor;
  private checkboxExecutor: CheckboxActionExecutor;
  private judgeExecutor: JudgeActionExecutor;
  private selectExecutor: SelectActionExecutor;
  private changeUrlExecutor: ChangeUrlActionExecutor;
  private screenshotExecutor: ScreenshotActionExecutor;
  private getValueExecutor: GetValueActionExecutor;

  // Domain services (business logic delegation)
  private xpathSelectionService: XPathSelectionService;

  // Infrastructure controllers (responsibility separation)
  private retryController: RetryController;
  private timeoutManager: TimeoutManager;
  private cancellationCoordinator: CancellationCoordinator;

  constructor(
    private systemSettingsRepository: SystemSettingsRepository,
    private automationResultRepository: AutomationResultRepository,
    private logger: Logger = new NoOpLogger()
  ) {
    this.messageDispatcher = new MessageDispatcher();
    this.progressReporter = new ProgressReporter(logger);

    // Initialize action executors
    this.inputExecutor = new InputActionExecutor(logger);
    this.clickExecutor = new ClickActionExecutor(logger);
    this.checkboxExecutor = new CheckboxActionExecutor(logger);
    this.judgeExecutor = new JudgeActionExecutor(logger);
    this.selectExecutor = new SelectActionExecutor(logger, systemSettingsRepository);
    this.changeUrlExecutor = new ChangeUrlActionExecutor(logger);
    this.screenshotExecutor = new ScreenshotActionExecutor(logger);
    this.getValueExecutor = new GetValueActionExecutor(logger);

    // Initialize domain services
    this.xpathSelectionService = new XPathSelectionService();

    // Initialize infrastructure controllers
    this.retryController = new RetryController(logger);
    this.timeoutManager = new TimeoutManager(logger);
    this.cancellationCoordinator = new CancellationCoordinator(logger);
  }

  /**
   * Request cancellation of auto-fill for a specific tab
   * Delegates to CancellationCoordinator
   */
  public static requestCancellation(tabId: number): void {
    CancellationCoordinator.requestCancellation(tabId);
  }

  /**
   * Clear cancellation flag for a specific tab
   * Delegates to CancellationCoordinator
   */
  private clearCancellationFlag(tabId: number): void {
    this.cancellationCoordinator.clearCancellationFlag(tabId);
  }

  /**
   * Check if cancellation was requested for a specific tab
   * Delegates to CancellationCoordinator
   */
  private isCancelled(tabId: number): boolean {
    return this.cancellationCoordinator.isCancelled(tabId);
  }

  /**
   * Execute auto-fill with progress tracking
   * @param tabId - Tab ID to execute auto-fill on
   * @param xpaths - XPath data to execute
   * @param url - Current URL
   * @param variables - Variables for replacement
   * @param automationResult - AutomationResult for progress tracking
   * @param startOffset - Starting index (for resume)
   */
  // eslint-disable-next-line max-params -- Main orchestration method for auto-fill with progress tracking and resume support. Parameters are necessary for complete feature functionality.
  async executeAutoFillWithProgress(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables?: VariableCollection,
    automationResult?: AutomationResult | null,
    startOffset: number = 0
  ): Promise<AutoFillResult> {
    return this.executeAutoFillWithRetry(tabId, xpaths, url, variables, (t, x, u, v) =>
      this.executeAutoFillAttemptWithProgress(t, x, u, v, automationResult, startOffset)
    );
  }

  async executeAutoFill(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables?: VariableCollection
  ): Promise<AutoFillResult> {
    return this.executeAutoFillWithRetry(tabId, xpaths, url, variables, (t, x, u, v) =>
      this.executeAutoFillAttempt(t, x, u, v)
    );
  }

  /**
   * Common retry loop logic for auto-fill execution
   *
   * This method consolidates the duplicate retry loop logic previously present in both
   * executeAutoFill() and executeAutoFillWithProgress(). It implements the core retry
   * mechanism with the following features:
   *
   * - Concurrent execution prevention (one execution per tab)
   * - Configurable retry attempts (including infinite retry mode)
   * - Random wait time between retries (configured via SystemSettings)
   * - Cancellation support with checks at multiple points
   * - Proper cleanup of execution state in finally block
   *
   * The retry loop continues until:
   * 1. Execution succeeds
   * 2. Maximum retry count is reached (unless infinite mode)
   * 3. User cancels the operation
   * 4. A step fails with retry disabled
   *
   * @param tabId - Tab ID to execute auto-fill on
   * @param xpaths - XPath data to execute
   * @param url - Current URL (used for logging)
   * @param variables - Variables for replacement in XPath values
   * @param attemptExecutor - Function to execute a single auto-fill attempt
   *                          Different implementations are passed for normal vs. progress tracking mode
   * @returns AutoFillResult indicating success/failure and processed steps count
   *
   * @example
   * // Normal execution
   * executeAutoFillWithRetry(tabId, xpaths, url, variables,
   *   (t, x, u, v) => this.executeAutoFillAttempt(t, x, u, v)
   * );
   *
   * @example
   * // Progress tracking execution
   * executeAutoFillWithRetry(tabId, xpaths, url, variables,
   *   (t, x, u, v) => this.executeAutoFillAttemptWithProgress(t, x, u, v, automationResult, startOffset)
   * );
   */
  // eslint-disable-next-line complexity, max-lines-per-function, max-params -- Common retry loop orchestration method consolidating duplicate logic from two public methods. The sequential flow with cancellation checks, retry logic, and wait periods is essential for the feature. Splitting would fragment the cohesive retry mechanism.
  private async executeAutoFillWithRetry(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables: VariableCollection | undefined,
    attemptExecutor: (
      tabId: number,
      xpaths: XPathData[],
      url: string,
      variables?: VariableCollection
    ) => Promise<AutoFillResult>
  ): Promise<AutoFillResult> {
    // Prevent concurrent executions on the same tab
    if (ChromeAutoFillAdapter.activeExecutions.get(tabId)) {
      this.logger.warn(
        `Auto-fill already in progress on tab ${tabId}. Ignoring duplicate request.`
      );
      return {
        success: false,
        processedSteps: 0,
        error: 'Auto-fill already in progress on this tab',
      };
    }

    // Mark this tab as having an active execution
    ChromeAutoFillAdapter.activeExecutions.set(tabId, true);

    try {
      this.clearCancellationFlag(tabId);

      const settingsResult = await this.systemSettingsRepository.load();
      if (settingsResult.isFailure) {
        throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
      }
      const systemSettings = settingsResult.value!;

      const retryConfig = {
        min: systemSettings.getRetryWaitSecondsMin(),
        max: systemSettings.getRetryWaitSecondsMax(),
        maxRetries: systemSettings.getRetryCount(),
        isInfinite: systemSettings.getRetryCount() === -1,
      };

      this.logger.info(
        `Retry configuration - Max attempts: ${retryConfig.isInfinite ? 'infinite' : retryConfig.maxRetries}, Wait time: ${retryConfig.min}-${retryConfig.max} seconds (random)`
      );

      let retryCount = 0;

      while (retryConfig.isInfinite || retryCount <= retryConfig.maxRetries) {
        // Check for cancellation at the start of each retry iteration
        if (this.isCancelled(tabId)) {
          this.logger.info('Auto-fill cancelled by user during retry loop');
          this.clearCancellationFlag(tabId);
          return {
            success: false,
            processedSteps: 0,
            error: 'Auto-fill cancelled by user',
          };
        }

        if (retryCount > 0) {
          this.logRetryAttempt(retryCount, retryConfig.isInfinite, retryConfig.maxRetries);
        }

        const result = await attemptExecutor(tabId, xpaths, url, variables);

        if (result.success) {
          this.logSuccess(retryCount);
          return result;
        }

        this.logger.info(`Auto-fill failed at step ${result.failedStep}. Error: ${result.error}`);

        // Check if error is due to cancellation - don't retry in this case
        if (result.error && result.error.includes('cancelled by user')) {
          this.logger.info('Auto-fill was cancelled by user, stopping retry loop');
          return result;
        }

        if (!this.shouldRetryStep(xpaths, result.failedStep)) {
          return result;
        }

        retryCount++;
        if (retryConfig.isInfinite || retryCount <= retryConfig.maxRetries) {
          this.logger.info(
            `Will retry after waiting (attempt ${retryCount}/${retryConfig.isInfinite ? '∞' : retryConfig.maxRetries})`
          );
          const cancelled = await this.waitBeforeRetry(
            tabId,
            result.failedStep,
            retryCount,
            retryConfig
          );
          if (cancelled) {
            this.logger.info('Auto-fill cancelled by user during retry wait');
            this.clearCancellationFlag(tabId);
            return {
              success: false,
              processedSteps: 0,
              error: 'Auto-fill cancelled by user',
            };
          }
        } else {
          return this.createMaxRetriesError(result, retryConfig.maxRetries);
        }
      }

      return { success: false, processedSteps: 0, error: 'Maximum retry attempts reached' };
    } finally {
      // Always clear the active execution flag, even if an error occurred
      ChromeAutoFillAdapter.activeExecutions.delete(tabId);
      this.logger.debug(`Cleared active execution flag for tab ${tabId}`);
    }
  }

  private shouldRetryStep(xpaths: XPathData[], failedStep?: number): boolean {
    // Delegate to RetryController
    return this.retryController.shouldRetryStep(xpaths, failedStep);
  }

  /**
   * Wait before retry with cancellation support
   * Delegates to RetryController and CancellationCoordinator
   * @returns true if cancelled, false if completed normally
   */
  private async waitBeforeRetry(
    tabId: number,
    failedStep: number | undefined,
    retryCount: number,
    config: { min: number; max: number; isInfinite: boolean; maxRetries: number }
  ): Promise<boolean> {
    // Calculate wait time using RetryController
    const waitTime = this.retryController.calculateWaitTime(config);
    const waitTimeRounded = this.retryController.roundWaitTime(waitTime);

    // Log wait information
    this.retryController.logWaitBeforeRetry(
      failedStep,
      waitTimeRounded,
      waitTime,
      retryCount,
      config
    );

    // Wait with cancellation check
    const waitStartTime = Date.now();
    const cancelled = await this.sleepWithCancellation(tabId, waitTime * 1000);
    const actualWaitTime = (Date.now() - waitStartTime) / 1000;

    // Log result
    if (cancelled) {
      this.retryController.logWaitCancelled(actualWaitTime, waitTimeRounded);
      return true; // Cancelled
    }

    this.retryController.logWaitCompleted(actualWaitTime, waitTimeRounded);
    return false; // Completed normally
  }

  private logRetryAttempt(retryCount: number, isInfinite: boolean, maxRetries: number): void {
    // Delegate to RetryController
    this.retryController.logRetryAttempt(retryCount, {
      min: 0,
      max: 0,
      maxRetries,
      isInfinite,
    });
  }

  private logSuccess(retryCount: number): void {
    // Delegate to RetryController
    this.retryController.logSuccess(retryCount);
  }

  private createMaxRetriesError(result: AutoFillResult, maxRetries: number): AutoFillResult {
    // Delegate to RetryController
    return this.retryController.createMaxRetriesError(result, maxRetries);
  }

  /**
   * Execute auto-fill attempt with progress tracking
   * @param tabId - Tab ID
   * @param xpaths - XPath data array
   * @param url - Current URL
   * @param variables - Variables for replacement
   * @param automationResult - AutomationResult for progress tracking
   * @param startOffset - Starting index (for resume)
   */
  // eslint-disable-next-line complexity, max-lines-per-function, max-params -- Coordinates the execution of a complete auto-fill sequence with variable replacement, progress tracking, timeout handling, cancellation checks, and resume support. The sequential step execution with conditional variable storage, progress saving, and wait times is clear and necessary for the feature.
  private async executeAutoFillAttemptWithProgress(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables?: VariableCollection,
    automationResult?: AutomationResult | null,
    startOffset: number = 0
  ): Promise<AutoFillResult> {
    try {
      // Delegate sorting to domain service
      const sortedXPaths = this.xpathSelectionService.sortByExecutionOrder(xpaths);

      // Apply startOffset if resuming
      const xpathsToExecute = startOffset > 0 ? sortedXPaths.slice(startOffset) : sortedXPaths;

      this.logger.info(
        `Starting auto-fill with ${xpathsToExecute.length} steps${startOffset > 0 ? ` (resuming from step ${startOffset})` : ''}`
      );

      // Make variables mutable by cloning (for GET_VALUE dynamic variable addition)
      const mutableVariables = variables ? variables.clone() : new VariableCollection();

      let processedSteps = 0;

      for (const xpath of xpathsToExecute) {
        if (this.isCancelled(tabId)) {
          this.logger.info(`Auto-fill cancelled by user at step ${xpath.executionOrder}`);
          this.clearCancellationFlag(tabId);
          return {
            success: false,
            processedSteps,
            failedStep: xpath.executionOrder,
            error: 'Auto-fill cancelled by user',
          };
        }

        // Execute step with timeout if executionTimeoutSeconds is set
        const result = await this.executeStepWithTimeout(
          tabId,
          xpath,
          mutableVariables,
          processedSteps,
          xpathsToExecute.length
        );

        if (!result.success) {
          return {
            success: false,
            processedSteps,
            failedStep: xpath.executionOrder,
            error: result.error || `Failed to execute step ${xpath.executionOrder}`,
          };
        }

        // If GET_VALUE action, add retrieved value to variables
        if (xpath.actionType === ACTION_TYPE.GET_VALUE && result.retrievedValue) {
          mutableVariables.add({
            name: result.variableName || xpath.value,
            value: result.retrievedValue,
          });
          this.logger.info(
            `Variable '${result.variableName || xpath.value}' added with value: ${result.retrievedValue.substring(0, 50)}${result.retrievedValue.length > 50 ? '...' : ''}`
          );
        }

        processedSteps++;

        // Save progress after CHANGE_URL action
        if (xpath.actionType === ACTION_TYPE.CHANGE_URL && automationResult) {
          await this.saveProgress(automationResult, startOffset + processedSteps, xpath.value);
        }

        await this.progressReporter.report(tabId, processedSteps, xpathsToExecute.length, '');

        if (xpath.afterWaitSeconds > 0) {
          this.logger.debug(
            `Waiting ${xpath.afterWaitSeconds}s after step ${xpath.executionOrder}`
          );
          const cancelled = await this.sleepWithCancellation(tabId, xpath.afterWaitSeconds * 1000);
          if (cancelled) {
            this.logger.info(
              `Auto-fill cancelled by user during wait after step ${xpath.executionOrder}`
            );
            this.clearCancellationFlag(tabId);
            return {
              success: false,
              processedSteps,
              failedStep: xpath.executionOrder,
              error: 'Auto-fill cancelled by user',
            };
          }
        }
      }

      this.logger.info(`Auto-fill completed successfully. Processed ${processedSteps} steps.`);
      return { success: true, processedSteps };
    } catch (error) {
      this.logger.error('Auto-fill execution error', error);
      return {
        success: false,
        processedSteps: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // eslint-disable-next-line complexity, max-lines-per-function -- Coordinates the execution of a complete auto-fill sequence with variable replacement, progress tracking, timeout handling, and cancellation checks. The sequential step execution with conditional variable storage and wait times is clear and necessary for the feature.
  private async executeAutoFillAttempt(
    tabId: number,
    xpaths: XPathData[],
    url: string,
    variables?: VariableCollection
  ): Promise<AutoFillResult> {
    try {
      // Delegate sorting to domain service
      const sortedXPaths = this.xpathSelectionService.sortByExecutionOrder(xpaths);
      this.logger.info(`Starting auto-fill with ${sortedXPaths.length} steps`);

      // Make variables mutable by cloning (for GET_VALUE dynamic variable addition)
      const mutableVariables = variables ? variables.clone() : new VariableCollection();

      let processedSteps = 0;

      for (const xpath of sortedXPaths) {
        if (this.isCancelled(tabId)) {
          this.logger.info(`Auto-fill cancelled by user at step ${xpath.executionOrder}`);
          this.clearCancellationFlag(tabId);
          return {
            success: false,
            processedSteps,
            failedStep: xpath.executionOrder,
            error: 'Auto-fill cancelled by user',
          };
        }

        // Execute step with timeout if executionTimeoutSeconds is set
        const result = await this.executeStepWithTimeout(
          tabId,
          xpath,
          mutableVariables,
          processedSteps,
          sortedXPaths.length
        );

        if (!result.success) {
          return {
            success: false,
            processedSteps,
            failedStep: xpath.executionOrder,
            error: result.error || `Failed to execute step ${xpath.executionOrder}`,
          };
        }

        // If GET_VALUE action, add retrieved value to variables
        if (xpath.actionType === ACTION_TYPE.GET_VALUE && result.retrievedValue) {
          mutableVariables.add({
            name: result.variableName || xpath.value,
            value: result.retrievedValue,
          });
          this.logger.info(
            `Variable '${result.variableName || xpath.value}' added with value: ${result.retrievedValue.substring(0, 50)}${result.retrievedValue.length > 50 ? '...' : ''}`
          );
        }

        processedSteps++;
        await this.progressReporter.report(tabId, processedSteps, sortedXPaths.length, '');

        if (xpath.afterWaitSeconds > 0) {
          this.logger.debug(
            `Waiting ${xpath.afterWaitSeconds}s after step ${xpath.executionOrder}`
          );
          const cancelled = await this.sleepWithCancellation(tabId, xpath.afterWaitSeconds * 1000);
          if (cancelled) {
            this.logger.info(
              `Auto-fill cancelled by user during wait after step ${xpath.executionOrder}`
            );
            this.clearCancellationFlag(tabId);
            return {
              success: false,
              processedSteps,
              failedStep: xpath.executionOrder,
              error: 'Auto-fill cancelled by user',
            };
          }
        }
      }

      this.logger.info(`Auto-fill completed successfully. Processed ${processedSteps} steps.`);
      return { success: true, processedSteps };
    } catch (error) {
      this.logger.error('Auto-fill execution error', error);
      return {
        success: false,
        processedSteps: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // eslint-disable-next-line max-params
  private async executeStepWithTimeout(
    tabId: number,
    xpath: XPathData,
    variables: VariableCollection | undefined,
    processedSteps: number,
    totalSteps: number
  ): Promise<{ success: boolean; error?: string; retrievedValue?: string; variableName?: string }> {
    // Delegate to TimeoutManager
    const timeoutSeconds = xpath.executionTimeoutSeconds || 0;
    const result = await this.timeoutManager.executeWithTimeout(
      () => this.executeStep(tabId, xpath, variables, processedSteps, totalSteps),
      timeoutSeconds,
      tabId,
      xpath.executionOrder,
      (tid) => this.isCancelled(tid)
    );

    // Convert TimeoutResult to expected format
    if (result.success && result.result) {
      return result.result;
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  // eslint-disable-next-line max-params
  private async executeStep(
    tabId: number,
    xpath: XPathData,
    variables: VariableCollection | undefined,
    processedSteps: number,
    totalSteps: number
  ): Promise<{ success: boolean; error?: string; retrievedValue?: string; variableName?: string }> {
    try {
      const stepDescription = `${xpath.actionType}: ${xpath.value.substring(0, 30)}${xpath.value.length > 30 ? '...' : ''}`;
      await this.progressReporter.report(tabId, processedSteps, totalSteps, stepDescription);

      const processedXPath = this.applyVariableReplacement(xpath, variables);
      this.logger.info(
        `Executing step ${processedXPath.executionOrder}: ${processedXPath.actionType} - ${processedXPath.value}`
      );

      const xpathToUse = this.selectXPathByPattern(processedXPath);
      const executionResult = await this.executeAction(tabId, processedXPath, xpathToUse);

      if (!executionResult.success) {
        return { success: false, error: executionResult.message };
      }

      // Pass through GET_VALUE results if present
      if (xpath.actionType === ACTION_TYPE.GET_VALUE && 'retrievedValue' in executionResult) {
        const getValueResult = executionResult as GetValueExecutionResult;
        return {
          success: true,
          retrievedValue: getValueResult.retrievedValue,
          variableName: getValueResult.variableName,
        };
      }

      return { success: true };
    } catch (stepError) {
      this.logger.error(`Error in step ${xpath.executionOrder}`, stepError);
      return {
        success: false,
        error: stepError instanceof Error ? stepError.message : 'Unknown error',
      };
    }
  }

  private applyVariableReplacement(xpath: XPathData, variables?: VariableCollection): XPathData {
    if (!variables) {
      return xpath;
    }

    const processedXPath = {
      ...xpath,
      value: variables.replaceVariables(xpath.value),
      pathShort: variables.replaceVariables(xpath.pathShort),
      pathAbsolute: variables.replaceVariables(xpath.pathAbsolute),
      pathSmart: variables.replaceVariables(xpath.pathSmart),
      url: variables.replaceVariables(xpath.url),
    };

    this.logger.debug(`[Step ${processedXPath.executionOrder}] After variable replacement`, {
      executionOrder: processedXPath.executionOrder,
      actionType: processedXPath.actionType,
      value: processedXPath.value,
      url: processedXPath.url,
      selectedPathPattern: processedXPath.selectedPathPattern,
      pathShort: processedXPath.pathShort,
      pathAbsolute: processedXPath.pathAbsolute,
      pathSmart: processedXPath.pathSmart,
      afterWaitSeconds: processedXPath.afterWaitSeconds,
      actionPattern: processedXPath.actionPattern,
      retryType: processedXPath.retryType,
      executionTimeoutSeconds: processedXPath.executionTimeoutSeconds,
    });

    return processedXPath;
  }

  private selectXPathByPattern(xpath: XPathData): string {
    // Delegate XPath selection to domain service
    return this.xpathSelectionService.selectXPath(xpath);
  }

  // eslint-disable-next-line complexity, max-lines-per-function -- Dispatches execution to appropriate action executors based on action type. The switch statement with 11 action types is clear and necessary for routing each action to its specialized executor.
  private async executeAction(
    tabId: number,
    xpath: XPathData,
    xpathToUse: string
  ): Promise<{ success: boolean; message?: string }> {
    // Create cancellation status checker function
    const getCancellationStatus = () => this.isCancelled(tabId);

    switch (xpath.actionType) {
      case ACTION_TYPE.CHANGE_URL:
        return await this.changeUrlExecutor.execute(
          tabId,
          '',
          xpath.value,
          xpath.actionPattern,
          xpath.executionOrder,
          undefined,
          getCancellationStatus
        );

      case ACTION_TYPE.TYPE:
        return await this.inputExecutor.execute(
          tabId,
          xpathToUse,
          xpath.value,
          xpath.actionPattern,
          xpath.executionOrder
        );

      case ACTION_TYPE.CLICK:
        return await this.clickExecutor.execute(
          tabId,
          xpathToUse,
          '',
          xpath.actionPattern,
          xpath.executionOrder
        );

      case ACTION_TYPE.JUDGE:
        return await this.judgeExecutor.execute(
          tabId,
          xpathToUse,
          xpath.value,
          xpath.actionPattern,
          xpath.executionOrder
        );

      case ACTION_TYPE.CHECK:
        return await this.checkboxExecutor.execute(
          tabId,
          xpathToUse,
          xpath.value,
          xpath.actionPattern,
          xpath.executionOrder
        );

      case ACTION_TYPE.SELECT_VALUE:
      case ACTION_TYPE.SELECT_INDEX:
      case ACTION_TYPE.SELECT_TEXT:
      case ACTION_TYPE.SELECT_TEXT_EXACT:
        return await this.selectExecutor.execute(
          tabId,
          xpathToUse,
          xpath.value,
          xpath.actionPattern,
          xpath.executionOrder,
          xpath.actionType
        );

      case ACTION_TYPE.SCREENSHOT:
        return await this.screenshotExecutor.execute(
          tabId,
          xpathToUse,
          xpath.value,
          xpath.actionPattern,
          xpath.executionOrder
        );

      case ACTION_TYPE.GET_VALUE:
        return await this.getValueExecutor.execute(
          tabId,
          xpathToUse,
          xpath.value,
          xpath.actionPattern,
          xpath.executionOrder
        );

      default:
        this.logger.warn(`Unknown action type: ${xpath.actionType}`);
        return {
          success: false,
          message: `Unknown action type: ${xpath.actionType}`,
        };
    }
  }

  /**
   * Save progress after CHANGE_URL action
   * Updates AutomationResult with current step index and last executed URL
   * Errors are logged but do not interrupt execution
   * @param automationResult - AutomationResult to update
   * @param currentStepIndex - Current step index
   * @param lastExecutedUrl - Last executed URL
   */
  private async saveProgress(
    automationResult: AutomationResult,
    currentStepIndex: number,
    lastExecutedUrl: string
  ): Promise<void> {
    try {
      const updatedResult = automationResult
        .setCurrentStepIndex(currentStepIndex)
        .setLastExecutedUrl(lastExecutedUrl);

      await this.automationResultRepository.save(updatedResult);

      this.logger.info('Progress saved', {
        currentStepIndex,
        totalSteps: updatedResult.getTotalSteps(),
        lastExecutedUrl: lastExecutedUrl.substring(0, 50),
        progress: `${updatedResult.getProgressPercentage().toFixed(1)}%`,
      });
    } catch (error) {
      // Log error but do not interrupt execution
      this.logger.warn('Failed to save progress (continuing execution)', {
        error: error instanceof Error ? error.message : String(error),
        currentStepIndex,
      });
    }
  }

  /**
   * Sleep for a specified time with cancellation support
   * Checks for cancellation every 100ms during sleep
   * Delegates to CancellationCoordinator
   * @param tabId - Tab ID to check cancellation for
   * @param ms - Milliseconds to sleep
   * @returns true if cancelled, false if completed normally
   */
  private async sleepWithCancellation(tabId: number, ms: number): Promise<boolean> {
    return this.cancellationCoordinator.sleepWithCancellationCheck(tabId, ms);
  }

  /**
   * Legacy sleep method (kept for compatibility)
   * @deprecated Use sleepWithCancellation instead for cancellable operations
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
