/**
 * Domain Service: Conflict Resolver Interface
 * Resolves data conflicts during bidirectional synchronization
 */

/**
 * Conflict data representing a conflict between local and remote data
 */
export interface ConflictData<T = any> {
  /** Local data with metadata */
  local: {
    data: T;
    timestamp: string; // ISO 8601
    source: 'chrome_storage';
  };
  /** Remote data with metadata */
  remote: {
    data: T;
    timestamp: string; // ISO 8601
    source: 'notion' | 'spread-sheet';
  };
  /** Storage key where the conflict occurred */
  storageKey: string;
}

/**
 * Result of conflict resolution
 */
export interface ConflictResolutionResult<T = any> {
  /** Whether the conflict was resolved */
  resolved: boolean;
  /** The winning data to use */
  winner: 'local' | 'remote' | 'none';
  /** The resolved data (undefined if winner is 'none') */
  data?: T;
  /** Reason for the resolution */
  reason: string;
  /** Whether user confirmation is required */
  requiresUserConfirmation: boolean;
}

/**
 * Conflict resolution policy
 */
export type ConflictResolutionPolicy =
  | 'latest_timestamp' // Use data with the most recent timestamp
  | 'local_priority' // Always prefer local data
  | 'remote_priority' // Always prefer remote data
  | 'user_confirm'; // Require user confirmation

/**
 * Conflict Resolver Service
 *
 * Provides conflict resolution capabilities for bidirectional sync:
 * - Automatic resolution based on policy
 * - Timestamp comparison
 * - User confirmation support
 */
export interface ConflictResolver {
  /**
   * Resolve a conflict between local and remote data
   *
   * @param conflict The conflict data
   * @param policy The resolution policy to use
   * @returns Resolution result
   */
  resolve<T>(
    conflict: ConflictData<T>,
    policy: ConflictResolutionPolicy
  ): ConflictResolutionResult<T>;

  /**
   * Check if conflict exists between local and remote data
   *
   * @param localData Local data
   * @param remoteData Remote data
   * @returns True if data differs and conflict exists
   */
  hasConflict<T>(localData: T, remoteData: T): boolean;

  /**
   * Create conflict data from local and remote sources
   *
   * @param localData Local data
   * @param localTimestamp Local data timestamp
   * @param remoteData Remote data
   * @param remoteTimestamp Remote data timestamp
   * @param storageKey Storage key
   * @param remoteSource Remote source type
   * @returns Conflict data
   */
  createConflict<T>(
    localData: T,
    localTimestamp: string,
    remoteData: T,
    remoteTimestamp: string,
    storageKey: string,
    remoteSource: 'notion' | 'spread-sheet'
  ): ConflictData<T>;
}
