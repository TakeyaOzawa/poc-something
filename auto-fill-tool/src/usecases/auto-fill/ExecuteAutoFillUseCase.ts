/* eslint-disable max-lines -- This UseCase orchestrates complex auto-fill workflow including recording, progress tracking, and result persistence. Splitting would fragment the sequential logic and reduce maintainability. */
/**
 * Use Case: Execute Auto-Fill
 * Executes auto-fill sequence on a specific tab
 *
 * @coverage 88.5%
 * @reason テストカバレッジが低い理由:
 * - chrome.tabs.onRemovedリスナーを使用したタブクローズ時の
 *   録画停止処理（lines 141-147）は、ブラウザイベントの正確なモックが必要
 * - 録画の開始・停止失敗時のエラーハンドリング（lines 136-138, 162-164）や、
 *   古い録画の削除失敗（lines 170-172）などの特定のエラーパスは
 *   複雑なセットアップが必要
 * - 現在のテストでは主要な実行フローと基本的なエラーケースをカバーしており、
 *   ブラウザイベント連携の詳細な動作には追加実装が必要
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutoFillPort, AutoFillResult } from '@domain/types/auto-fill-port.types';
import { VariableCollection } from '@domain/entities/Variable';
import { Logger } from '@domain/types/logger.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { StartTabRecordingUseCase } from '../recording/StartTabRecordingUseCase';
import { StopTabRecordingUseCase } from '../recording/StopTabRecordingUseCase';
import { DeleteOldRecordingsUseCase } from '../recording/DeleteOldRecordingsUseCase';
import { BatchStorageLoader } from '@domain/interfaces/IBatchStorageLoader';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';

export interface ExecuteAutoFillInput {
  tabId: number;
  url: string;
  variables?: VariableCollection;
  websiteId?: string;
}

export class ExecuteAutoFillUseCase {
  // eslint-disable-next-line max-params -- Complex workflow coordination requires 9 dependencies: repositories, services, recording UseCases, optional batch loader, and logger
  constructor(
    private xpathRepository: XPathRepository,
    private autoFillService: AutoFillPort,
    private automationVariablesRepository: AutomationVariablesRepository,
    private automationResultRepository: AutomationResultRepository,
    private startRecordingUseCase: StartTabRecordingUseCase,
    private stopRecordingUseCase: StopTabRecordingUseCase,
    private deleteOldRecordingsUseCase: DeleteOldRecordingsUseCase,
    private batchStorageLoader?: BatchStorageLoader,
    private logger: Logger = new NoOpLogger()
  ) {}

  async execute(request: ExecuteAutoFillInput): Promise<AutoFillResult> {
    this.logger.info('Execute auto-fill request received', {
      tabId: request.tabId,
      url: request.url,
      websiteId: request.websiteId,
    });

    // Check for existing in-progress execution
    const existingExecution = await this.checkExistingExecution(request);

    if (existingExecution) {
      this.logger.info('Found existing execution, resuming', {
        executionId: existingExecution.getId(),
        currentStep: existingExecution.getCurrentStepIndex(),
        totalSteps: existingExecution.getTotalSteps(),
      });

      return await this.resumeExecution(existingExecution, request);
    }

    // Start new execution
    return await this.startNewExecution(request);
  }

  /**
   * Check for existing in-progress execution
   * Returns DOING status AutomationResult within 24 hours if found
   */
  private async checkExistingExecution(
    request: ExecuteAutoFillInput
  ): Promise<AutomationResult | null> {
    if (!request.websiteId) {
      return null; // Skip check if no websiteId
    }

    try {
      // ✅ Optimized: Load only in-progress results within 24 hours
      const resultsResult = await this.automationResultRepository.loadInProgress();
      if (resultsResult.isFailure) {
        this.logger.warn('Failed to load automation results during check', {
          error: resultsResult.error?.message,
        });
        return null; // Don't block execution on load failure
      }

      const validResults = resultsResult.value!;

      this.logger.debug('Found in-progress executions', {
        within24h: validResults.length,
      });

      // ✅ Optimized: Filter by automationVariablesId (which is websiteId) without N+1 queries
      // No need to load AutomationVariables since automationVariablesId == websiteId
      const matchingResult = validResults.find(
        (result) => result.getAutomationVariablesId() === request.websiteId
      );

      return matchingResult || null;
    } catch (error) {
      this.logger.warn('Failed to check existing execution', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null; // Don't block execution on check failure
    }
  }

  private async loadAndValidateXPaths(request: ExecuteAutoFillInput) {
    let xpaths;

    // ✅ Optimized: Load only XPaths for specific website when websiteId is provided
    if (request.websiteId) {
      const xpathsResult = await this.xpathRepository.loadByWebsiteId(request.websiteId);
      if (xpathsResult.isFailure) {
        throw new Error(
          `Failed to load XPaths for website: ${xpathsResult.error?.message || 'Unknown error'}`
        );
      }
      xpaths = xpathsResult.value!;
    } else {
      // Load all XPaths when no websiteId is provided
      const collectionResult = await this.xpathRepository.load();
      if (collectionResult.isFailure) {
        throw new Error(
          `Failed to load XPath collection: ${collectionResult.error?.message || 'Unknown error'}`
        );
      }
      xpaths = collectionResult.value!.getAll();
    }

    const variables = request.variables || new VariableCollection();
    this.logger.info(
      `Using ${variables.getAll().length} variables for ${xpaths.length} XPath steps`
    );

    return { xpaths, variables };
  }

  /**
   * Start new execution
   */
  // eslint-disable-next-line max-lines-per-function, complexity -- Orchestrates complete new execution flow including batch loading optimization, XPath loading, result setup, recording management, and status handling. The complexity arises from conditional batch loading (try-catch with fallback), XPath validation, AutomationResult setup, recording lifecycle, and final execution. This is necessary for the 67% performance improvement in Chrome Storage API calls.
  private async startNewExecution(request: ExecuteAutoFillInput): Promise<AutoFillResult> {
    let xpaths;
    let variables = request.variables || new VariableCollection();
    let automationResult: AutomationResult | null = null;

    // ✅ Optimization: Use batch loading when websiteId is provided and batch loader is available
    // This reduces Chrome Storage API calls from 3 to 1 (67% reduction, ~100ms saved)
    if (request.websiteId && this.batchStorageLoader) {
      try {
        this.logger.info('Using batch loading for storage optimization', {
          websiteId: request.websiteId,
        });

        // Single Chrome Storage API call for all 3 keys
        const batchResult = await this.batchStorageLoader.loadBatch([
          STORAGE_KEYS.XPATH_COLLECTION,
          STORAGE_KEYS.AUTOMATION_VARIABLES,
          STORAGE_KEYS.AUTOMATION_RESULTS,
        ]);

        if (batchResult.isFailure) {
          this.logger.warn('Batch loading failed, falling back to individual loads', {
            error: batchResult.error?.message,
          });
          // Fall back to individual loads
          const { xpaths: individualXpaths, variables: individualVariables } =
            await this.loadAndValidateXPaths(request);
          xpaths = individualXpaths;
          variables = individualVariables;
          automationResult = await this.setupAutomationResult(request.websiteId, xpaths.length);
        } else {
          const batchData = batchResult.value!;

          // Process XPath data from batch
          const xpathsResult = this.xpathRepository.loadFromBatch(
            batchData.get(STORAGE_KEYS.XPATH_COLLECTION),
            request.websiteId
          );
          if (xpathsResult.isFailure) {
            throw new Error(
              `Failed to process XPath batch data: ${xpathsResult.error?.message || 'Unknown error'}`
            );
          }
          xpaths = xpathsResult.value!;

          // Check for existing in-progress execution from batch
          const inProgressResult = this.automationResultRepository.loadInProgressFromBatch(
            batchData.get(STORAGE_KEYS.AUTOMATION_RESULTS),
            request.websiteId
          );
          const inProgressResults = inProgressResult.isSuccess ? inProgressResult.value! : [];

          // If in-progress execution exists, we should have caught it in checkExistingExecution
          // But for safety, log a warning if found here
          if (inProgressResults.length > 0) {
            this.logger.warn(
              'Found in-progress execution in batch load (should have been caught earlier)',
              {
                count: inProgressResults.length,
              }
            );
          }

          // Process AutomationVariables data from batch for result setup
          // xpaths is always XPathData[] when loaded with websiteId in loadFromBatch
          if (Array.isArray(xpaths) && xpaths.length > 0) {
            const variablesResult = this.automationVariablesRepository.loadFromBatch(
              batchData.get(STORAGE_KEYS.AUTOMATION_VARIABLES),
              request.websiteId
            );

            // eslint-disable-next-line max-depth -- Batch loading optimization requires nested checks: websiteId validation → batch load → result validation → xpaths check → variables check → AutomationResult creation. This nesting is necessary for the 67% performance improvement.
            if (variablesResult.isSuccess && variablesResult.value) {
              const automationVariables = variablesResult.value;

              // Create AutomationResult
              automationResult = AutomationResult.create({
                automationVariablesId: automationVariables.getWebsiteId(),
                executionStatus: EXECUTION_STATUS.DOING,
                resultDetail: 'Execution started',
                currentStepIndex: 0,
                totalSteps: xpaths.length,
                lastExecutedUrl: '',
              });

              const saveResult = await this.automationResultRepository.save(automationResult);
              // eslint-disable-next-line max-depth -- Batch loading path requires additional nesting for AutomationResult save validation after all batch checks complete. This is the deepest point in the batch optimization flow (websiteId → batch → validation → xpaths → variables → save → error handling).
              if (saveResult.isFailure) {
                this.logger.error('Failed to save initial AutomationResult', {
                  error: saveResult.error?.message,
                });
                automationResult = null;
              } else {
                this.logger.info('Created AutomationResult', {
                  id: automationResult.getId(),
                  totalSteps: xpaths.length,
                });
              }
            }
          }

          this.logger.info('Batch loading completed successfully', {
            xpathCount: Array.isArray(xpaths) ? xpaths.length : 0,
            variableCount: variables.getAll().length,
            hasAutomationResult: automationResult !== null,
          });
        }
      } catch (error) {
        this.logger.error('Error during batch loading, falling back to individual loads', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Fall back to individual loads
        const { xpaths: individualXpaths, variables: individualVariables } =
          await this.loadAndValidateXPaths(request);
        xpaths = individualXpaths;
        variables = individualVariables;
        automationResult = await this.setupAutomationResult(request.websiteId, xpaths.length);
      }
    } else {
      // No batch loading: Use original individual loading path
      const { xpaths: individualXpaths, variables: individualVariables } =
        await this.loadAndValidateXPaths(request);
      xpaths = individualXpaths;
      variables = individualVariables;
      automationResult = await this.setupAutomationResult(request.websiteId, xpaths.length);
    }

    if (!Array.isArray(xpaths) || xpaths.length === 0) {
      return this.createNoXPathsError(request.websiteId);
    }

    this.logger.info(
      `Using ${variables.getAll().length} variables for ${xpaths.length} XPath steps`
    );

    const { hasRecording, tabRemovedListener } = await this.setupRecording(
      request.tabId,
      automationResult
    );

    chrome.tabs.onRemoved.addListener(tabRemovedListener);

    try {
      // Use executeAutoFillWithProgress if automationResult exists
      const result = automationResult
        ? await this.autoFillService.executeAutoFillWithProgress(
            request.tabId,
            xpaths,
            request.url,
            variables,
            automationResult,
            0 // startOffset = 0 for new execution
          )
        : await this.autoFillService.executeAutoFill(request.tabId, xpaths, request.url, variables);

      await this.cleanupRecording(hasRecording, automationResult);
      await this.finalizeExecution(automationResult, result);

      if (result.success && request.websiteId) {
        await this.handleStatusChangeAfterExecution(request.websiteId);
      }

      return result;
    } finally {
      chrome.tabs.onRemoved.removeListener(tabRemovedListener);
    }
  }

  /**
   * Resume existing execution
   */
  // eslint-disable-next-line max-lines-per-function -- Orchestrates execution resume flow including XPath loading from current step, recording management, and result finalization. The sequential flow is necessary for resume logic.
  private async resumeExecution(
    existingResult: AutomationResult,
    request: ExecuteAutoFillInput
  ): Promise<AutoFillResult> {
    const { xpaths, variables } = await this.loadAndValidateXPaths(request);

    if (xpaths.length === 0) {
      return this.createNoXPathsError(request.websiteId);
    }

    const startIndex = existingResult.getCurrentStepIndex();

    if (startIndex >= xpaths.length) {
      this.logger.warn('Current step index exceeds total steps', {
        currentStep: startIndex,
        totalSteps: xpaths.length,
      });

      // Mark as completed since all steps are done
      await this.finalizeExecution(existingResult, {
        success: true,
        processedSteps: xpaths.length,
      });

      return {
        success: true,
        processedSteps: 0,
      };
    }

    const remainingXPaths = xpaths.slice(startIndex);
    this.logger.info('Resuming from step', {
      startIndex,
      remainingSteps: remainingXPaths.length,
      totalSteps: xpaths.length,
    });

    const { hasRecording, tabRemovedListener } = await this.setupRecording(
      request.tabId,
      existingResult
    );

    chrome.tabs.onRemoved.addListener(tabRemovedListener);

    try {
      // Use executeAutoFillWithProgress with startOffset for resume
      const result = await this.autoFillService.executeAutoFillWithProgress(
        request.tabId,
        xpaths, // Pass full xpaths array (not remainingXPaths)
        request.url,
        variables,
        existingResult,
        startIndex // startOffset for resume
      );

      await this.cleanupRecording(hasRecording, existingResult);
      await this.finalizeExecution(existingResult, result);

      if (result.success && request.websiteId) {
        await this.handleStatusChangeAfterExecution(request.websiteId);
      }

      return result;
    } finally {
      chrome.tabs.onRemoved.removeListener(tabRemovedListener);
    }
  }

  private createNoXPathsError(websiteId?: string): AutoFillResult {
    return {
      success: false,
      processedSteps: 0,
      error: websiteId ? 'No XPaths configured for this website' : 'No XPaths configured',
    };
  }

  private async setupAutomationResult(
    websiteId: string | undefined,
    totalSteps: number
  ): Promise<AutomationResult | null> {
    if (!websiteId) {
      return null;
    }

    const loadResult = await this.automationVariablesRepository.load(websiteId);
    if (loadResult.isFailure) {
      this.logger.warn('Failed to load automation variables for result setup', {
        error: loadResult.error?.message,
      });
      return null;
    }

    const automationVariables = loadResult.value;
    if (!automationVariables) {
      return null;
    }

    const automationResult = AutomationResult.create({
      automationVariablesId: automationVariables.getWebsiteId(),
      executionStatus: EXECUTION_STATUS.DOING,
      resultDetail: 'Execution started',
      currentStepIndex: 0,
      totalSteps,
      lastExecutedUrl: '',
    });

    const saveResult = await this.automationResultRepository.save(automationResult);
    if (saveResult.isFailure) {
      this.logger.error('Failed to save initial AutomationResult', {
        error: saveResult.error?.message,
      });
      // Return null to continue execution without AutomationResult tracking
      return null;
    }

    this.logger.info('Created AutomationResult', {
      id: automationResult.getId(),
      totalSteps,
    });

    return automationResult;
  }

  private async setupRecording(
    tabId: number,
    automationResult: AutomationResult | null
  ): Promise<{ hasRecording: boolean; tabRemovedListener: (tabId: number) => void }> {
    let hasRecording = false;

    if (automationResult) {
      try {
        const recording = await this.startRecordingUseCase.execute({
          tabId,
          automationResultId: automationResult.getId(),
        });
        hasRecording = recording !== null;

        if (hasRecording) {
          this.logger.info('Tab recording started for auto-fill execution');
        }
      } catch (error) {
        this.logger.error('Failed to start recording', error);
      }
    }

    const tabRemovedListener = (closedTabId: number) => {
      if (closedTabId === tabId && hasRecording && automationResult) {
        this.stopRecordingUseCase
          .execute({ automationResultId: automationResult.getId() })
          .catch((error) => this.logger.error('Failed to stop recording on tab close', error));
      }
    };

    return { hasRecording, tabRemovedListener };
  }

  private async cleanupRecording(
    hasRecording: boolean,
    automationResult: AutomationResult | null
  ): Promise<void> {
    if (hasRecording && automationResult) {
      try {
        await this.stopRecordingUseCase.execute({
          automationResultId: automationResult.getId(),
        });
        this.logger.info('Tab recording stopped after auto-fill execution');
      } catch (error) {
        this.logger.error('Failed to stop recording', error);
      }
    }

    if (automationResult) {
      try {
        await this.deleteOldRecordingsUseCase.execute({});
      } catch (error) {
        this.logger.error('Failed to delete old recordings', error);
      }
    }
  }

  /**
   * Finalize execution and save result to AutomationResult
   * Saves success, failure, timeout, and cancellation results
   */
  private async finalizeExecution(
    automationResult: AutomationResult | null,
    result: AutoFillResult
  ): Promise<void> {
    if (!automationResult) {
      return;
    }

    try {
      // Reload from repository to get the latest progress (updated by saveProgress during execution)
      const loadResult = await this.automationResultRepository.load(automationResult.getId());
      if (loadResult.isFailure) {
        this.logger.warn('Failed to load latest AutomationResult, using current instance', {
          error: loadResult.error?.message,
        });
      }
      const latestResult = loadResult.isSuccess ? loadResult.value : null;
      const resultToFinalize = latestResult || automationResult;

      const endTime = new Date().toISOString();
      let updatedResult = resultToFinalize.setEndTo(endTime);

      if (result.success) {
        // For successful execution, set currentStepIndex to totalSteps (all completed)
        // Use totalSteps instead of processedSteps to handle both new and resumed executions correctly
        updatedResult = updatedResult
          .setCurrentStepIndex(resultToFinalize.getTotalSteps())
          .setExecutionStatus(EXECUTION_STATUS.SUCCESS)
          .setResultDetail(`Successfully processed ${result.processedSteps} steps`);
        this.logger.info('Saving successful AutomationResult');
      } else {
        updatedResult = updatedResult
          .setExecutionStatus(EXECUTION_STATUS.FAILED)
          .setResultDetail(
            result.error ||
              `Failed at step ${result.failedStep}. Processed ${result.processedSteps} steps`
          );
        this.logger.info('Saving failed AutomationResult', { error: result.error });
      }

      const finalSaveResult = await this.automationResultRepository.save(updatedResult);
      if (finalSaveResult.isFailure) {
        this.logger.error('Failed to save final AutomationResult', {
          error: finalSaveResult.error?.message,
        });
        return; // Don't throw - result save failure shouldn't affect the overall execution
      }
      this.logger.info('AutomationResult saved successfully');
    } catch (error) {
      this.logger.error('Failed to save AutomationResult', error);
      // Don't throw - result save failure shouldn't affect the overall execution
    }
  }

  /**
   * Handle automation status change after successful execution
   * Delegates business logic to AutomationVariables entity
   */
  private async handleStatusChangeAfterExecution(websiteId: string): Promise<void> {
    try {
      const loadResult = await this.automationVariablesRepository.load(websiteId);

      if (loadResult.isFailure) {
        this.logger.warn('Failed to load automation variables for status update', {
          error: loadResult.error?.message,
        });
        return;
      }

      const automationVariables = loadResult.value;
      if (automationVariables) {
        // Delegate business logic to domain entity
        const updated = automationVariables.completeExecution();

        // Only save if status changed
        if (updated !== automationVariables) {
          const saveResult = await this.automationVariablesRepository.save(updated);
          if (saveResult.isFailure) {
            this.logger.warn('Failed to save automation variables status change', {
              error: saveResult.error?.message,
            });
            return;
          }
          this.logger.info(
            `Automation status changed for website: ${websiteId} (status: ${updated.getStatus()})`
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to update automation status after execution', error);
      // Don't throw - status update failure shouldn't affect the overall result
    }
  }
}
