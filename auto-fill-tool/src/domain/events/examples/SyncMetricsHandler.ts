/**
 * Example Event Handler: Sync Metrics Handler
 * Demonstrates how to collect metrics from domain events
 */

import { AsyncEventHandler } from '../EventHandler';
import { SyncCompletedEvent, SyncFailedEvent } from '../events/SyncEvents';
import { DomainEvent } from '../DomainEvent';
import { Logger } from '@domain/types/logger.types';

/**
 * Collects and aggregates sync operation metrics
 * This demonstrates using events for cross-cutting concerns like analytics
 */
export class SyncMetricsHandler extends AsyncEventHandler {
  private metrics: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalDuration: number;
    totalItemsSynced: number;
  } = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    totalDuration: 0,
    totalItemsSynced: 0,
  };

  constructor(private logger: Logger) {
    super();
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof SyncCompletedEvent) {
      this.handleCompleted(event);
    } else if (event instanceof SyncFailedEvent) {
      this.handleFailed(event);
    }

    // Log current metrics periodically
    if (this.metrics.totalSyncs % 10 === 0 && this.metrics.totalSyncs > 0) {
      this.logMetrics();
    }
  }

  private handleCompleted(event: SyncCompletedEvent): void {
    this.metrics.totalSyncs++;
    this.metrics.successfulSyncs++;
    this.metrics.totalDuration += event.duration;
    this.metrics.totalItemsSynced += event.itemsSynced;

    this.logger.debug('Sync metrics updated', {
      configId: event.configId,
      successRate: this.getSuccessRate(),
      avgDuration: this.getAverageDuration(),
    });
  }

  private handleFailed(event: SyncFailedEvent): void {
    this.metrics.totalSyncs++;
    this.metrics.failedSyncs++;

    this.logger.warn('Sync failure recorded', {
      configId: event.configId,
      error: event.error,
      phase: event.phase,
      failureRate: this.getFailureRate(),
    });
  }

  private logMetrics(): void {
    this.logger.info('Sync metrics summary', {
      totalSyncs: this.metrics.totalSyncs,
      successRate: this.getSuccessRate(),
      failureRate: this.getFailureRate(),
      avgDuration: this.getAverageDuration(),
      totalItemsSynced: this.metrics.totalItemsSynced,
    });
  }

  private getSuccessRate(): number {
    if (this.metrics.totalSyncs === 0) return 0;
    return (this.metrics.successfulSyncs / this.metrics.totalSyncs) * 100;
  }

  private getFailureRate(): number {
    if (this.metrics.totalSyncs === 0) return 0;
    return (this.metrics.failedSyncs / this.metrics.totalSyncs) * 100;
  }

  private getAverageDuration(): number {
    if (this.metrics.successfulSyncs === 0) return 0;
    return this.metrics.totalDuration / this.metrics.successfulSyncs;
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.getSuccessRate(),
      failureRate: this.getFailureRate(),
      avgDuration: this.getAverageDuration(),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      totalDuration: 0,
      totalItemsSynced: 0,
    };
    this.logger.info('Sync metrics reset');
  }

  getSupportedEventTypes(): string[] {
    return ['SyncCompleted', 'SyncFailed'];
  }
}
