/**
 * Unit Tests: ChromeStorageAutomationVariablesRepository
 */

import browser from 'webextension-polyfill';
import { ChromeStorageAutomationVariablesRepository } from '../ChromeStorageAutomationVariablesRepository';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
let idCounter = 0;
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => `mock-id-${++idCounter}`),
};
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { Logger } from '@domain/types/logger.types';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}));

describe('ChromeStorageAutomationVariablesRepository', () => {
  let repository: ChromeStorageAutomationVariablesRepository;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    repository = new ChromeStorageAutomationVariablesRepository(mockLogger);
  });

  describe('save', () => {
    it('should save new automation variables to storage', async () => {
      const variables = AutomationVariables.create(
        {
          websiteId: 'website_123',
          variables: { username: 'testuser' },
          status: AUTOMATION_STATUS.ENABLED,
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const saveResult = await repository.save(variables);
      expect(saveResult.isSuccess).toBe(true);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables.toData()],
      });
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('created'));
    });

    it('should update existing automation variables', async () => {
      const variables = AutomationVariables.create(
        {
          websiteId: 'website_123',
          variables: { username: 'testuser' },
        },
        mockIdGenerator
      );

      const existingData = [variables.toData()];

      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.AUTOMATION_VARIABLES]: existingData,
        },
        mockIdGenerator
      );
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const updated = variables.setVariable('password', 'newpass');
      const saveResult = await repository.save(updated);
      expect(saveResult.isSuccess).toBe(true);

      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
        STORAGE_KEYS.AUTOMATION_VARIABLES
      ];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(variables.getId());
      expect(savedData[0].variables).toEqual({ username: 'testuser', password: 'newpass' });
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('updated'));
    });

    it(
      'should append to existing storage',
      async () => {
        const existingVariables = AutomationVariables.create(
          {
            websiteId: 'website_001',
            variables: { key: 'value' },
          },
          mockIdGenerator
        );

        const newVariables = AutomationVariables.create(
          {
            websiteId: 'website_002',
            variables: { username: 'testuser' },
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.AUTOMATION_VARIABLES]: [existingVariables.toData()],
          },
          mockIdGenerator
        );
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const saveResult = await repository.save(newVariables);
        expect(saveResult.isSuccess).toBe(true);

        const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
          STORAGE_KEYS.AUTOMATION_VARIABLES
        ];
        expect(savedData).toHaveLength(2);
        expect(savedData[0].id).toBe(existingVariables.getId());
        expect(savedData[1].id).toBe(newVariables.getId());
      },
      mockIdGenerator
    );

    it(
      'should return failure if save fails',
      async () => {
        const variables = AutomationVariables.create(
          {
            websiteId: 'website_123',
            variables: {},
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({}, mockIdGenerator);
        (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

        const result = await repository.save(variables);

        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(Error);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to save automation variables',
          expect.any(Error)
        );
      },
      mockIdGenerator
    );
  });

  describe('load', () => {
    it('should load automation variables by id', async () => {
      const variables = AutomationVariables.create(
        {
          websiteId: 'website_123',
          variables: { username: 'testuser' },
          status: AUTOMATION_STATUS.ENABLED,
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables.toData()],
        },
        mockIdGenerator
      );

      const result = await repository.load(variables.getId());

      expect(result.isSuccess).toBe(true);
      const loadedVar = result.value!;

      expect(loadedVar).toBeInstanceOf(AutomationVariables);
      expect(loadedVar?.getId()).toBe(variables.getId());
      expect(loadedVar?.getWebsiteId()).toBe('website_123');
      expect(loadedVar?.getVariables()).toEqual({ username: 'testuser' }, mockIdGenerator);
      expect(loadedVar?.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
    });

    it('should load automation variables by websiteId', async () => {
      const variables = AutomationVariables.create(
        {
          websiteId: 'website_123',
          variables: { username: 'testuser' },
          status: AUTOMATION_STATUS.ENABLED,
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables.toData()],
        },
        mockIdGenerator
      );

      const result = await repository.load('website_123');

      expect(result.isSuccess).toBe(true);
      const loadedVar = result.value!;
      expect(loadedVar).toBeInstanceOf(AutomationVariables);
      expect(loadedVar?.getWebsiteId()).toBe('website_123');
      expect(loadedVar?.getVariables()).toEqual({ username: 'testuser' }, mockIdGenerator);
    });

    it('should return null if automation variables not found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [],
      });

      const result = await repository.load('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No automation variables found')
      );
    });

    it('should return failure if load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.load('website_123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load automation variables',
        expect.any(Error)
      );
    });
  });

  describe('loadAll', () => {
    it('should load all automation variables', async () => {
      const variables1 = AutomationVariables.create(
        {
          websiteId: 'website_001',
          variables: { key1: 'value1' },
          status: AUTOMATION_STATUS.ENABLED,
        },
        mockIdGenerator
      );

      const variables2 = AutomationVariables.create(
        {
          websiteId: 'website_002',
          variables: { key2: 'value2' },
          status: AUTOMATION_STATUS.DISABLED,
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables1.toData(), variables2.toData()],
        },
        mockIdGenerator
      );

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      const variables = result.value!;
      expect(variables).toHaveLength(2);
      expect(variables[0].getId()).toBe(variables1.getId());
      expect(variables[1].getId()).toBe(variables2.getId());
      expect(mockLogger.info).toHaveBeenCalledWith('Loading all automation variables');
    });

    it('should return empty array if no automation variables exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should return failure if loadAll fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.loadAll();

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load all automation variables',
        expect.any(Error)
      );
    });
  });

  describe('delete', () => {
    it('should delete automation variables by id', async () => {
      const variables1 = AutomationVariables.create(
        {
          websiteId: 'website_001',
          variables: {},
        },
        mockIdGenerator
      );
      const variables2 = AutomationVariables.create(
        {
          websiteId: 'website_002',
          variables: {},
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables1.toData(), variables2.toData()],
        },
        mockIdGenerator
      );
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete(variables1.getId());

      expect(result.isSuccess).toBe(true);
      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
        STORAGE_KEYS.AUTOMATION_VARIABLES
      ];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(variables2.getId());
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('deleted'));
    });

    it(
      'should delete automation variables by websiteId',
      async () => {
        const variables1 = AutomationVariables.create(
          {
            websiteId: 'website_001',
            variables: {},
          },
          mockIdGenerator
        );
        const variables2 = AutomationVariables.create(
          {
            websiteId: 'website_002',
            variables: {},
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables1.toData(), variables2.toData()],
          },
          mockIdGenerator
        );
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const result = await repository.delete('website_001');

        expect(result.isSuccess).toBe(true);
        const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
          STORAGE_KEYS.AUTOMATION_VARIABLES
        ];
        expect(savedData).toHaveLength(1);
        expect(savedData[0].websiteId).toBe('website_002');
      },
      mockIdGenerator
    );

    it('should warn if automation variables not found to delete', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [],
      });

      const result = await repository.delete('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No automation variables found to delete')
      );
    });

    it(
      'should return failure if delete operation fails',
      async () => {
        const variables = AutomationVariables.create(
          {
            websiteId: 'website_123',
            variables: {},
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables.toData()],
          },
          mockIdGenerator
        );
        (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

        const result = await repository.delete('website_123');

        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error!.message).toBe('Storage error');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to delete automation variables',
          expect.any(Error)
        );
      },
      mockIdGenerator
    );
  });

  describe('exists', () => {
    it(
      'should return true if automation variables exist by id',
      async () => {
        const variables = AutomationVariables.create(
          {
            websiteId: 'website_123',
            variables: {},
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.exists(variables.getId());

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(true);
      },
      mockIdGenerator
    );

    it(
      'should return true if automation variables exist by websiteId',
      async () => {
        const variables = AutomationVariables.create(
          {
            websiteId: 'website_123',
            variables: {},
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.exists('website_123');

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(true);
      },
      mockIdGenerator
    );

    it('should return false if automation variables do not exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [],
      });

      const result = await repository.exists('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should return failure if exists check fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.exists('website_123');

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to check automation variables existence',
        expect.any(Error)
      );
    });
  });

  describe('legacy format support (backward compatibility)', () => {
    it('should convert legacy object format to array format on load', async () => {
      const legacyData = {
        website_001: {
          id: 'legacy-id-1',
          websiteId: 'website_001',
          variables: { key: 'value1' },
          status: AUTOMATION_STATUS.ENABLED,
          updatedAt: '2025-10-07T00:00:00.000Z',
        },
        website_002: {
          id: 'legacy-id-2',
          websiteId: 'website_002',
          variables: { key: 'value2' },
          status: AUTOMATION_STATUS.DISABLED,
          updatedAt: '2025-10-07T00:00:00.000Z',
        },
      };

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: legacyData,
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      const variables = result.value!;
      expect(variables).toHaveLength(2);
      expect(variables[0].getId()).toBe('legacy-id-1');
      expect(variables[1].getId()).toBe('legacy-id-2');

      // Verify that storage was converted to array format
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [legacyData.website_001, legacyData.website_002],
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('legacy object format'));
    });

    it(
      'should handle array format without conversion',
      async () => {
        const variables = AutomationVariables.create(
          {
            websiteId: 'website_123',
            variables: { key: 'value' },
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.AUTOMATION_VARIABLES]: [variables.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.loadAll();

        expect(result.isSuccess).toBe(true);
        const loadedVars = result.value!;
        expect(loadedVars).toHaveLength(1);
        expect(loadedVars[0].getId()).toBe(variables.getId());

        // Should NOT call set (no conversion needed)
        expect(browser.storage.local.set).not.toHaveBeenCalled();
      },
      mockIdGenerator
    );
  });
});
