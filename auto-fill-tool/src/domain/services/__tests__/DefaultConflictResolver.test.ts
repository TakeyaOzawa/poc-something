/**
 * Tests for DefaultConflictResolver
 */

import { DefaultConflictResolver } from '../DefaultConflictResolver';
import { ConflictData } from '@domain/types/conflict-resolver.types';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock Logger
const createMockLogger = (): jest.Mocked<Logger> => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn(),
  createChild: jest.fn().mockReturnThis(),
});

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('DefaultConflictResolver', () => {
  let resolver: DefaultConflictResolver;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    resolver = new DefaultConflictResolver(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      expect(mockLogger.info).toHaveBeenCalledWith('DefaultConflictResolver initialized');
    });
  });

  describe('hasConflict', () => {
    it('should detect conflict when data differs', () => {
      const localData = { name: 'John', age: 30 };
      const remoteData = { name: 'John', age: 31 };

      const hasConflict = resolver.hasConflict(localData, remoteData);

      expect(hasConflict).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Checking for conflict',
        expect.objectContaining({ hasConflict: true })
      );
    });

    it('should not detect conflict when data is identical', () => {
      const localData = { name: 'John', age: 30 };
      const remoteData = { name: 'John', age: 30 };

      const hasConflict = resolver.hasConflict(localData, remoteData);

      expect(hasConflict).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Checking for conflict',
        expect.objectContaining({ hasConflict: false })
      );
    });

    it('should detect conflict for arrays with different order', () => {
      const localData = [1, 2, 3];
      const remoteData = [3, 2, 1];

      const hasConflict = resolver.hasConflict(localData, remoteData);

      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict for arrays with same order', () => {
      const localData = [1, 2, 3];
      const remoteData = [1, 2, 3];

      const hasConflict = resolver.hasConflict(localData, remoteData);

      expect(hasConflict).toBe(false);
    });
  });

  describe('createConflict', () => {
    it('should create conflict data with correct structure', () => {
      const localData = { name: 'Local' };
      const remoteData = { name: 'Remote' };
      const localTimestamp = '2024-01-01T00:00:00Z';
      const remoteTimestamp = '2024-01-02T00:00:00Z';
      const storageKey = 'testKey';
      const remoteSource = 'notion' as const;

      const conflict = resolver.createConflict(
        localData,
        localTimestamp,
        remoteData,
        remoteTimestamp,
        storageKey,
        remoteSource
      );

      expect(conflict).toEqual({
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
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Creating conflict data',
        expect.objectContaining({
          storageKey,
          remoteSource,
        })
      );
    });
  });

  describe('resolve - latest_timestamp policy', () => {
    it('should resolve to local data when local is newer', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-02T00:00:00Z',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'latest_timestamp');

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('local');
      expect(result.data).toEqual({ value: 'local' });
      expect(result.reason).toContain('Local data is newer');
      expect(result.requiresUserConfirmation).toBe(false);
    });

    it('should resolve to remote data when remote is newer', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-02T00:00:00Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'latest_timestamp');

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('remote');
      expect(result.data).toEqual({ value: 'remote' });
      expect(result.reason).toContain('Remote data is newer');
      expect(result.requiresUserConfirmation).toBe(false);
    });

    it('should resolve to local data when timestamps are equal', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'latest_timestamp');

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('local');
      expect(result.data).toEqual({ value: 'local' });
      expect(result.reason).toContain('Timestamps are equal');
      expect(result.requiresUserConfirmation).toBe(false);
    });

    it('should handle invalid timestamps and default to local', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: 'invalid-timestamp',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'latest_timestamp');

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('local');
      expect(result.reason).toContain('Invalid timestamps');
      expect(mockLogger.error).toHaveBeenCalledWith('Invalid timestamp format', expect.anything());
    });
  });

  describe('resolve - local_priority policy', () => {
    it('should always resolve to local data', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-02T00:00:00Z', // Remote is newer
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'local_priority');

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('local');
      expect(result.data).toEqual({ value: 'local' });
      expect(result.reason).toContain('Local priority policy');
      expect(result.requiresUserConfirmation).toBe(false);
    });
  });

  describe('resolve - remote_priority policy', () => {
    it('should always resolve to remote data', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-02T00:00:00Z', // Local is newer
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'remote_priority');

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('remote');
      expect(result.data).toEqual({ value: 'remote' });
      expect(result.reason).toContain('Remote priority policy');
      expect(result.requiresUserConfirmation).toBe(false);
    });
  });

  describe('resolve - user_confirm policy', () => {
    it('should return unresolved result requiring user confirmation', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-02T00:00:00Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'user_confirm');

      expect(result.resolved).toBe(false);
      expect(result.winner).toBe('none');
      expect(result.data).toBeUndefined();
      expect(result.reason).toContain('User confirmation required');
      expect(result.requiresUserConfirmation).toBe(true);
    });
  });

  describe('resolve - unknown policy', () => {
    it('should default to latest_timestamp policy and log warning', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-02T00:00:00Z',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-01T00:00:00Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'unknown_policy' as any);

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('local');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Unknown conflict resolution policy, defaulting to latest_timestamp',
        expect.objectContaining({ policy: 'unknown_policy' })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null data', () => {
      const localData = null;
      const remoteData = { value: 'remote' };

      const hasConflict = resolver.hasConflict(localData, remoteData);

      expect(hasConflict).toBe(true);
    });

    it('should handle undefined data', () => {
      const localData = undefined;
      const remoteData = undefined;

      const hasConflict = resolver.hasConflict(localData, remoteData);

      // JSON.stringify(undefined) returns undefined, which causes an error
      // The resolver catches this and assumes there's a conflict
      expect(hasConflict).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to serialize data for conflict check',
        expect.anything()
      );
    });

    it('should handle complex nested objects', () => {
      const localData = {
        user: { name: 'John', address: { city: 'NYC', zip: '10001' } },
        items: [1, 2, 3],
      };
      const remoteData = {
        user: { name: 'John', address: { city: 'LA', zip: '90001' } },
        items: [1, 2, 3],
      };

      const hasConflict = resolver.hasConflict(localData, remoteData);

      expect(hasConflict).toBe(true);
    });

    it('should handle timestamps with milliseconds', () => {
      const conflict: ConflictData<any> = {
        local: {
          data: { value: 'local' },
          timestamp: '2024-01-01T00:00:00.123Z',
          source: 'chrome_storage',
        },
        remote: {
          data: { value: 'remote' },
          timestamp: '2024-01-01T00:00:00.456Z',
          source: 'notion',
        },
        storageKey: 'testKey',
      };

      const result = resolver.resolve(conflict, 'latest_timestamp');

      expect(result.resolved).toBe(true);
      expect(result.winner).toBe('remote');
    });
  });
});
