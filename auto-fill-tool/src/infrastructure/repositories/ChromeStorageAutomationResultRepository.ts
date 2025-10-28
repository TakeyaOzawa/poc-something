/**
 * Infrastructure Repository: ChromeStorageAutomationResultRepository
 * Implementation of AutomationResultRepository using Chrome Storage API
 */

import browser from 'webextension-polyfill';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult, AutomationResultData } from '@domain/entities/AutomationResult';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';
import { ExecutionStatus, EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';

export class ChromeStorageAutomationResultRepository implements AutomationResultRepository {
  constructor(private logger: Logger) {}

  async save(result: AutomationResult): Promise<Result<void, Error>> {
    try {
      const storage = await this.loadStorage();
      const data = result.toData();

      const existingIndex = storage.findIndex((r) => r.id === data.id);
      if (existingIndex >= 0) {
        storage[existingIndex] = data;
        this.logger.info(`Automation result updated: ${data.id}`);
      } else {
        storage.push(data);
        this.logger.info(`Automation result created: ${data.id}`);
      }

      await this.saveStorage(storage);
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to save automation result', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to save automation result')
      );
    }
  }

  async load(id: string): Promise<Result<AutomationResult | null, Error>> {
    try {
      const storage = await this.loadStorage();
      const data = storage.find((r) => r.id === id);

      if (!data) {
        this.logger.info(`No automation result found for id: ${id}`);
        return Result.success(null);
      }

      return Result.success(new AutomationResult(data));
    } catch (error) {
      this.logger.error('Failed to load automation result', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load automation result')
      );
    }
  }

  async loadAll(): Promise<Result<AutomationResult[], Error>> {
    try {
      this.logger.info('Loading all automation results');
      const storage = await this.loadStorage();
      return Result.success(storage.map((data) => new AutomationResult(data)));
    } catch (error) {
      this.logger.error('Failed to load all automation results', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load all automation results')
      );
    }
  }

  async loadByStatus(status: ExecutionStatus): Promise<Result<AutomationResult[], Error>> {
    try {
      this.logger.info(`Loading automation results by status: ${status}`);
      const storage = await this.loadStorage();
      const filtered = storage.filter((data) => data.executionStatus === status);

      return Result.success(filtered.map((data) => new AutomationResult(data)));
    } catch (error) {
      this.logger.error('Failed to load automation results by status', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load automation results by status')
      );
    }
  }

  async loadInProgress(websiteId?: string): Promise<Result<AutomationResult[], Error>> {
    try {
      this.logger.info('Loading in-progress automation results', { websiteId });
      const storage = await this.loadStorage();

      // Filter by DOING status and within 24 hours
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      let filtered = storage.filter((data) => {
        if (data.executionStatus !== EXECUTION_STATUS.DOING) {
          return false;
        }

        const age = now - new Date(data.startFrom).getTime();
        return age < twentyFourHoursMs;
      });

      // If websiteId is provided, filter by websiteId from AutomationVariables
      if (websiteId) {
        filtered = filtered.filter((_data) => {
          // Note: websiteId filtering requires cross-referencing with AutomationVariables
          // This will be handled by the caller (ExecuteAutoFillUseCase) for now
          return true;
        });
        this.logger.info(`Filtered in-progress results by websiteId: ${websiteId}`);
      }

      return Result.success(filtered.map((data) => new AutomationResult(data)));
    } catch (error) {
      this.logger.error('Failed to load in-progress automation results', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load in-progress automation results')
      );
    }
  }

  loadInProgressFromBatch(
    rawStorageData: unknown,
    websiteId?: string
  ): Result<AutomationResult[], Error> {
    try {
      this.logger.info('Loading in-progress automation results from batch data', { websiteId });

      // Validate and parse raw storage data
      if (!Array.isArray(rawStorageData)) {
        return Result.success([]);
      }

      const storage = rawStorageData as AutomationResultData[];

      // Filter by DOING status and within 24 hours
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      let filtered = storage.filter((data) => {
        if (data.executionStatus !== EXECUTION_STATUS.DOING) {
          return false;
        }

        const age = now - new Date(data.startFrom).getTime();
        return age < twentyFourHoursMs;
      });

      // If websiteId is provided, filter by websiteId from AutomationVariables
      if (websiteId) {
        filtered = filtered.filter((_data) => {
          // Note: websiteId filtering requires cross-referencing with AutomationVariables
          // This will be handled by the caller (ExecuteAutoFillUseCase) for now
          return true;
        });
        this.logger.info(`Filtered in-progress results by websiteId: ${websiteId}`);
      }

      return Result.success(filtered.map((data) => new AutomationResult(data)));
    } catch (error) {
      this.logger.error('Failed to load in-progress automation results from batch', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to load in-progress automation results from batch')
      );
    }
  }

  async loadByAutomationVariablesId(
    variablesId: string
  ): Promise<Result<AutomationResult[], Error>> {
    try {
      this.logger.info(`Loading automation results for variables: ${variablesId}`);
      const storage = await this.loadStorage();
      const filtered = storage.filter((r) => r.automationVariablesId === variablesId);

      // Sort by startFrom descending (newest first)
      filtered.sort((a, b) => {
        return new Date(b.startFrom).getTime() - new Date(a.startFrom).getTime();
      });

      return Result.success(filtered.map((data) => new AutomationResult(data)));
    } catch (error) {
      this.logger.error('Failed to load automation results by variables ID', error);
      return Result.failure(
        error instanceof Error
          ? error
          : new Error('Failed to load automation results by variables ID')
      );
    }
  }

  async loadLatestByAutomationVariablesId(
    variablesId: string
  ): Promise<Result<AutomationResult | null, Error>> {
    try {
      const resultsResult = await this.loadByAutomationVariablesId(variablesId);

      if (resultsResult.isFailure) {
        return Result.failure(resultsResult.error!);
      }

      const results = resultsResult.value!;
      if (results.length === 0) {
        this.logger.info(`No automation results found for variables: ${variablesId}`);
        return Result.success(null);
      }

      return Result.success(results[0]);
    } catch (error) {
      this.logger.error('Failed to load latest automation result', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load latest automation result')
      );
    }
  }

  async delete(id: string): Promise<Result<void, Error>> {
    try {
      const storage = await this.loadStorage();
      const filtered = storage.filter((r) => r.id !== id);

      if (filtered.length === storage.length) {
        this.logger.warn(`No automation result found to delete: ${id}`);
        return Result.success(undefined);
      }

      await this.saveStorage(filtered);
      this.logger.info(`Automation result deleted: ${id}`);
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to delete automation result', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete automation result')
      );
    }
  }

  async deleteByAutomationVariablesId(variablesId: string): Promise<Result<void, Error>> {
    try {
      const storage = await this.loadStorage();
      const filtered = storage.filter((r) => r.automationVariablesId !== variablesId);

      await this.saveStorage(filtered);
      this.logger.info(`Automation results deleted for variables: ${variablesId}`);
      return Result.success(undefined);
    } catch (error) {
      this.logger.error('Failed to delete automation results by variables ID', error);
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to delete automation results')
      );
    }
  }

  private async loadStorage(): Promise<AutomationResultData[]> {
    const result = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_RESULTS);
    return (result[STORAGE_KEYS.AUTOMATION_RESULTS] as AutomationResultData[]) || [];
  }

  private async saveStorage(data: AutomationResultData[]): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.AUTOMATION_RESULTS]: data });
  }
}
