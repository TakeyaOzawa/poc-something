/**
 * Domain Service: Default Conflict Resolver Implementation
 * Implements conflict resolution strategies for bidirectional sync
 *
 * This service contains pure business logic for resolving conflicts between
 * local and remote data during synchronization. It does not depend on any
 * external systems or infrastructure concerns.
 *
 * @coverage >=90%
 * @reason Conflict resolution implementation with multiple strategies
 */

import {
  ConflictResolver,
  ConflictData,
  ConflictResolutionResult,
  ConflictResolutionPolicy,
} from '@domain/types/conflict-resolver.types';
import { Logger } from '@domain/types/logger.types';

export class DefaultConflictResolver implements ConflictResolver {
  constructor(private logger: Logger) {
    this.logger.info('DefaultConflictResolver initialized');
  }

  /**
   * Resolve a conflict between local and remote data
   */
  resolve<T>(
    conflict: ConflictData<T>,
    policy: ConflictResolutionPolicy
  ): ConflictResolutionResult<T> {
    this.logger.info('Resolving conflict', {
      storageKey: conflict.storageKey,
      policy,
      localTimestamp: conflict.local.timestamp,
      remoteTimestamp: conflict.remote.timestamp,
    });

    switch (policy) {
      case 'latest_timestamp':
        return this.resolveByLatestTimestamp(conflict);
      case 'local_priority':
        return this.resolveByLocalPriority(conflict);
      case 'remote_priority':
        return this.resolveByRemotePriority(conflict);
      case 'user_confirm':
        return this.resolveByUserConfirm(conflict);
      default:
        this.logger.warn('Unknown conflict resolution policy, defaulting to latest_timestamp', {
          policy,
        });
        return this.resolveByLatestTimestamp(conflict);
    }
  }

  /**
   * Check if conflict exists between local and remote data
   */
  hasConflict<T>(localData: T, remoteData: T): boolean {
    // Deep comparison using JSON serialization
    // Note: This is a simple implementation; production code may need more sophisticated comparison
    try {
      const localJson = JSON.stringify(localData);
      const remoteJson = JSON.stringify(remoteData);

      const hasConflict = localJson !== remoteJson;

      this.logger.debug('Checking for conflict', {
        hasConflict,
        localDataLength: localJson.length,
        remoteDataLength: remoteJson.length,
      });

      return hasConflict;
    } catch (error) {
      // Handle JSON serialization errors (e.g., circular references, undefined)
      this.logger.warn('Failed to serialize data for conflict check', {
        error: error instanceof Error ? error.message : String(error),
      });
      // If we can't serialize, assume there's a conflict
      return true;
    }
  }

  /**
   * Create conflict data from local and remote sources
   */
  // eslint-disable-next-line max-params -- Method needs 6 parameters to create a complete ConflictData object (local data, local timestamp, remote data, remote timestamp, storage key, remote source type). These parameters represent distinct pieces of information and cannot be reasonably combined without losing type safety and clarity.
  createConflict<T>(
    localData: T,
    localTimestamp: string,
    remoteData: T,
    remoteTimestamp: string,
    storageKey: string,
    remoteSource: 'notion' | 'spread-sheet'
  ): ConflictData<T> {
    this.logger.debug('Creating conflict data', {
      storageKey,
      remoteSource,
      localTimestamp,
      remoteTimestamp,
    });

    return {
      local: {
        data: localData,
        timestamp: localTimestamp,
        source: 'chrome_storage',
      },
      remote: {
        data: remoteData,
        timestamp: remoteTimestamp,
        source: remoteSource,
      },
      storageKey,
    };
  }

  /**
   * Resolve by latest timestamp (most recent wins)
   */
  // eslint-disable-next-line max-lines-per-function -- Implements complete latest_timestamp conflict resolution strategy including timestamp validation, parsing, comparison, and detailed logging for all resolution paths (local newer, remote newer, equal timestamps, invalid timestamps). The comprehensive error handling and logging requires this length for clarity and completeness.
  private resolveByLatestTimestamp<T>(conflict: ConflictData<T>): ConflictResolutionResult<T> {
    const localTime = new Date(conflict.local.timestamp).getTime();
    const remoteTime = new Date(conflict.remote.timestamp).getTime();

    if (isNaN(localTime) || isNaN(remoteTime)) {
      this.logger.error('Invalid timestamp format', {
        localTimestamp: conflict.local.timestamp,
        remoteTimestamp: conflict.remote.timestamp,
      });

      // Default to local if timestamps are invalid
      return {
        resolved: true,
        winner: 'local',
        data: conflict.local.data,
        reason: 'Invalid timestamps, defaulting to local data',
        requiresUserConfirmation: false,
      };
    }

    if (localTime > remoteTime) {
      this.logger.info('Resolved conflict: local data is newer', {
        localTime,
        remoteTime,
        diff: localTime - remoteTime,
      });

      return {
        resolved: true,
        winner: 'local',
        data: conflict.local.data,
        reason: `Local data is newer (${conflict.local.timestamp} > ${conflict.remote.timestamp})`,
        requiresUserConfirmation: false,
      };
    } else if (remoteTime > localTime) {
      this.logger.info('Resolved conflict: remote data is newer', {
        localTime,
        remoteTime,
        diff: remoteTime - localTime,
      });

      return {
        resolved: true,
        winner: 'remote',
        data: conflict.remote.data,
        reason: `Remote data is newer (${conflict.remote.timestamp} > ${conflict.local.timestamp})`,
        requiresUserConfirmation: false,
      };
    } else {
      // Timestamps are equal, prefer local
      this.logger.info('Resolved conflict: timestamps equal, preferring local', {
        timestamp: conflict.local.timestamp,
      });

      return {
        resolved: true,
        winner: 'local',
        data: conflict.local.data,
        reason: 'Timestamps are equal, defaulting to local data',
        requiresUserConfirmation: false,
      };
    }
  }

  /**
   * Resolve by local priority (local always wins)
   */
  private resolveByLocalPriority<T>(conflict: ConflictData<T>): ConflictResolutionResult<T> {
    this.logger.info('Resolved conflict: local priority policy', {
      storageKey: conflict.storageKey,
    });

    return {
      resolved: true,
      winner: 'local',
      data: conflict.local.data,
      reason: 'Local priority policy: local data always wins',
      requiresUserConfirmation: false,
    };
  }

  /**
   * Resolve by remote priority (remote always wins)
   */
  private resolveByRemotePriority<T>(conflict: ConflictData<T>): ConflictResolutionResult<T> {
    this.logger.info('Resolved conflict: remote priority policy', {
      storageKey: conflict.storageKey,
      remoteSource: conflict.remote.source,
    });

    return {
      resolved: true,
      winner: 'remote',
      data: conflict.remote.data,
      reason: 'Remote priority policy: remote data always wins',
      requiresUserConfirmation: false,
    };
  }

  /**
   * Resolve by user confirmation (requires user interaction)
   */
  private resolveByUserConfirm<T>(conflict: ConflictData<T>): ConflictResolutionResult<T> {
    this.logger.info('Conflict requires user confirmation', {
      storageKey: conflict.storageKey,
      localTimestamp: conflict.local.timestamp,
      remoteTimestamp: conflict.remote.timestamp,
    });

    // Return unresolved result that requires user confirmation
    return {
      resolved: false,
      winner: 'none',
      data: undefined,
      reason: 'User confirmation required to resolve conflict',
      requiresUserConfirmation: true,
    } as ConflictResolutionResult<T>;
  }
}
