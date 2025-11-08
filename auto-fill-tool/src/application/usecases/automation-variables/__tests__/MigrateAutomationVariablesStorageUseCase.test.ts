/**
 * Unit Tests: MigrateAutomationVariablesStorageUseCase
 */

import { MigrateAutomationVariablesStorageUseCase } from '../MigrateAutomationVariablesStorageUseCase';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import browser from 'webextension-polyfill';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('MigrateAutomationVariablesStorageUseCase', () => {
  let useCase: MigrateAutomationVariablesStorageUseCase;
  let automationVariablesRepository: ChromeStorageAutomationVariablesRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    automationVariablesRepository = new ChromeStorageAutomationVariablesRepository(
      new NoOpLogger()
    );
    useCase = new MigrateAutomationVariablesStorageUseCase(
      automationVariablesRepository,
      mockIdGenerator
    );

    // Setup default mocks
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});
    (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
  });

  it('should migrate object format to array format', async () => {
    // Setup legacy data (without id)
    const legacyData = {
      website_001: {
        websiteId: 'website_001',
        variables: { username: 'test@example.com', password: 'secret' },
        status: AUTOMATION_STATUS.ENABLED,
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
      website_002: {
        websiteId: 'website_002',
        variables: { api_key: 'key123' },
        status: AUTOMATION_STATUS.DISABLED,
        updatedAt: '2025-10-15T11:00:00.000Z',
      },
    };

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(true);
    expect(result.count).toBe(2);
    expect(result.errors).toHaveLength(0);

    // Verify array format was saved
    const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
    const migratedArray = savedData[STORAGE_KEYS.AUTOMATION_VARIABLES];

    expect(Array.isArray(migratedArray)).toBe(true);
    expect(migratedArray).toHaveLength(2);
    expect(migratedArray[0]).toHaveProperty('id');
    expect(migratedArray[0]).toHaveProperty('websiteId', 'website_001');
    expect(migratedArray[0]).toHaveProperty('variables');
    expect(migratedArray[0].variables).toEqual({
      username: 'test@example.com',
      password: 'secret',
    });
    expect(migratedArray[1]).toHaveProperty('id');
    expect(migratedArray[1]).toHaveProperty('websiteId', 'website_002');
  });

  it('should preserve existing ids in legacy data', async () => {
    // Setup legacy data with existing ids
    const legacyData = {
      website_001: {
        id: 'existing-id-1',
        websiteId: 'website_001',
        variables: { key: 'value1' },
        status: AUTOMATION_STATUS.ENABLED,
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
      website_002: {
        id: 'existing-id-2',
        websiteId: 'website_002',
        variables: { key: 'value2' },
        updatedAt: '2025-10-15T11:00:00.000Z',
      },
    };

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(true);
    expect(result.count).toBe(2);

    const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
    const migratedArray = savedData[STORAGE_KEYS.AUTOMATION_VARIABLES];

    expect(migratedArray[0].id).toBe('existing-id-1');
    expect(migratedArray[1].id).toBe('existing-id-2');
  });

  it('should return false if already in array format', async () => {
    const arrayData = [
      {
        id: 'id-1',
        websiteId: 'website_001',
        variables: {},
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
    ];

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: arrayData,
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(false);
    expect(result.count).toBe(1);
    expect(result.errors).toHaveLength(0);

    // Should NOT call set
    expect(browser.storage.local.set).not.toHaveBeenCalled();
  });

  it('should return false if no data exists', async () => {
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});

    const result = await useCase.execute();

    expect(result.migrated).toBe(false);
    expect(result.count).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle migration errors for individual entries', async () => {
    const legacyData = {
      website_001: {
        websiteId: 'website_001',
        variables: { key: 'value' },
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
      website_002: {
        // Invalid data: invalid status value
        websiteId: 'website_002',
        variables: { key: 'value' },
        status: 'INVALID_STATUS',
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
      website_003: {
        websiteId: 'website_003',
        variables: { key: 'value' },
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
    };

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(true);
    expect(result.count).toBe(2); // Successfully migrated 2 out of 3
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('website_002');
  });

  it('should return error if storage operation fails', async () => {
    const legacyData = {
      website_001: {
        websiteId: 'website_001',
        variables: {},
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
    };

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
    });
    (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const result = await useCase.execute();

    expect(result.migrated).toBe(false);
    expect(result.count).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('Migration failed');
  });

  it('should handle empty object format', async () => {
    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: {},
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(true);
    expect(result.count).toBe(0);
    expect(result.errors).toHaveLength(0);

    const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
    expect(savedData[STORAGE_KEYS.AUTOMATION_VARIABLES]).toEqual([]);
  });

  it('should preserve all variable fields during migration', async () => {
    const legacyData = {
      website_001: {
        websiteId: 'website_001',
        variables: {
          username: 'user@example.com',
          password: 'secret123',
          api_key: 'key123',
          endpoint: 'https://api.example.com',
        },
        status: AUTOMATION_STATUS.ENABLED,
        updatedAt: '2025-10-15T10:00:00.000Z',
      },
    };

    (browser.storage.local.get as jest.Mock).mockResolvedValue({
      [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
    });

    const result = await useCase.execute();

    expect(result.migrated).toBe(true);

    const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
    const migratedArray = savedData[STORAGE_KEYS.AUTOMATION_VARIABLES];

    expect(migratedArray[0].variables).toEqual({
      username: 'user@example.com',
      password: 'secret123',
      api_key: 'key123',
      endpoint: 'https://api.example.com',
    });
  });
});
