/**
 * Application Layer: Execute Scheduled Sync Use Case
 * Manages periodic synchronization scheduling for enabled configurations
 */

import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { SchedulerPort } from '@domain/ports/SchedulerPort';
import { Logger } from '@domain/types/logger.types';
import { ExecuteManualSyncUseCase } from './ExecuteManualSyncUseCase';

export interface ScheduleAllPeriodicSyncsInput {
  // No input required - loads all enabled periodic configs
}

export interface ScheduleAllPeriodicSyncsOutput {
  success: boolean;
  scheduledCount: number;
  error?: string;
}

export interface StopAllScheduledSyncsInput {
  // No input required - stops all scheduled syncs
}

export interface StopAllScheduledSyncsOutput {
  success: boolean;
}

/**
 * Use Case: Execute Scheduled Sync
 *
 * Responsibilities:
 * - Load all enabled periodic sync configurations
 * - Schedule periodic sync operations using SchedulerPort
 * - Execute manual sync for each scheduled configuration
 * - Manage lifecycle of scheduled syncs (start/stop)
 * - Handle errors during scheduling and execution
 */
export class ExecuteScheduledSyncUseCase {
  private activeSchedules: Set<string> = new Set();

  constructor(
    private storageSyncConfigRepository: StorageSyncConfigRepository,
    private schedulerService: SchedulerPort,
    private executeManualSyncUseCase: ExecuteManualSyncUseCase,
    private logger: Logger
  ) {}

  /**
   * Schedule all enabled periodic sync configurations
   */
  async scheduleAllPeriodicSyncs(
    _input: ScheduleAllPeriodicSyncsInput
  ): Promise<ScheduleAllPeriodicSyncsOutput> {
    this.logger.info('Loading enabled periodic sync configurations');

    const configsResult = await this.storageSyncConfigRepository.loadAllEnabledPeriodic();
    if (configsResult.isFailure) {
      this.logger.error('Failed to load enabled periodic sync configurations', configsResult.error);
      return {
        success: false,
        scheduledCount: 0,
        error: configsResult.error!.message,
      };
    }

    const configs = configsResult.value!;

    if (configs.length === 0) {
      this.logger.info('No enabled periodic sync configurations found');
      return { success: true, scheduledCount: 0 };
    }

    this.logger.info(`Found ${configs.length} enabled periodic sync configurations`);

    const scheduledCount = await this.scheduleConfigs(configs);

    this.logger.info(`Successfully scheduled ${scheduledCount} periodic syncs`);

    return { success: true, scheduledCount };
  }

  /**
   * Schedule all configurations in the list
   */
  private async scheduleConfigs(configs: unknown[]): Promise<number> {
    let scheduledCount = 0;
    for (const config of configs) {
      try {
        if (await this.scheduleConfig(config)) {
          scheduledCount++;
        }
      } catch (error) {
        this.logger.error(`Failed to schedule sync for config ${config.getId()}`, error);
      }
    }
    return scheduledCount;
  }

  /**
   * Schedule a single configuration
   */
  private async scheduleConfig(config: unknown): Promise<boolean> {
    const intervalSeconds = config.getSyncIntervalSeconds();
    if (!this.isValidInterval(intervalSeconds)) {
      this.logger.warn(`Skipping config ${config.getId()}: invalid interval ${intervalSeconds}s`);
      return false;
    }

    const intervalMinutes = Math.ceil(intervalSeconds / 60);
    const scheduleName = `periodic-sync-${config.getId()}`;

    if (this.activeSchedules.has(scheduleName)) {
      this.logger.debug(`Config ${config.getId()} already scheduled, skipping`);
      return false;
    }

    await this.schedulerService.scheduleRepeating(scheduleName, intervalMinutes, async () => {
      await this.executeSyncForSchedule(config);
    });

    this.activeSchedules.add(scheduleName);
    this.logger.info(`Scheduled sync for ${config.getId()} every ${intervalMinutes} minutes`);
    return true;
  }

  /**
   * Validate sync interval
   */
  private isValidInterval(intervalSeconds: number | undefined): boolean {
    return intervalSeconds !== undefined && intervalSeconds >= 60;
  }

  /**
   * Execute sync for a scheduled configuration
   */
  private async executeSyncForSchedule(config: unknown): Promise<void> {
    this.logger.info(`Executing scheduled sync for config ${config.getId()}`);

    try {
      const result = await this.executeManualSyncUseCase.execute({ config });

      if (result.success) {
        this.logger.info(`Scheduled sync completed successfully for ${config.getId()}`, {
          receivedCount: result.receiveResult?.receivedCount,
          sentCount: result.sendResult?.sentCount,
        });
      } else {
        this.logger.error(`Scheduled sync failed for ${config.getId()}`, {
          error: result.error,
        });
      }
    } catch (error) {
      this.logger.error(`Error executing scheduled sync for ${config.getId()}`, error);
    }
  }

  /**
   * Stop all scheduled syncs
   */
  async stopAllScheduledSyncs(
    _input: StopAllScheduledSyncsInput
  ): Promise<StopAllScheduledSyncsOutput> {
    try {
      this.logger.info('Stopping all scheduled syncs');

      // Cancel all alarms
      await this.schedulerService.cancelAll();

      // Clear active schedules
      const stoppedCount = this.activeSchedules.size;
      this.activeSchedules.clear();

      this.logger.info(`Stopped ${stoppedCount} scheduled syncs`);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to stop scheduled syncs', error);

      return {
        success: false,
      };
    }
  }

  /**
   * Stop a specific scheduled sync by config ID
   */
  async stopScheduledSync(configId: string): Promise<boolean> {
    try {
      const scheduleName = `periodic-sync-${configId}`;

      if (!this.activeSchedules.has(scheduleName)) {
        this.logger.warn(`No active schedule found for config ${configId}`);
        return false;
      }

      await this.schedulerService.cancel(scheduleName);
      this.activeSchedules.delete(scheduleName);

      this.logger.info(`Stopped scheduled sync for config ${configId}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to stop scheduled sync for config ${configId}`, error);
      return false;
    }
  }

  /**
   * Get count of active scheduled syncs
   */
  getActiveScheduleCount(): number {
    return this.activeSchedules.size;
  }

  /**
   * Check if a config is currently scheduled
   */
  isScheduled(configId: string): boolean {
    const scheduleName = `periodic-sync-${configId}`;
    return this.activeSchedules.has(scheduleName);
  }
}
