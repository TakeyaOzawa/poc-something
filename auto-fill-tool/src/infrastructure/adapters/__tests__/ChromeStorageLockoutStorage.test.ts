/**
 * Unit Tests: ChromeStorageLockoutStorage
 */

import { ChromeStorageLockoutStorage } from '../ChromeStorageLockoutStorage';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      },
    },
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChromeStorageLockoutStorage', () => {
  let storage: ChromeStorageLockoutStorage;

  beforeEach(() => {
    storage = new ChromeStorageLockoutStorage();
    jest.clearAllMocks();

    // Reset mock implementations
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});
    (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (browser.storage.local.remove as jest.Mock).mockResolvedValue(undefined);
  });

  describe('save', () => {
    it('should save lockout state to storage', async () => {
      const state = {
        failedAttempts: 3,
        lockoutStartedAt: Date.now(),
      };

      await storage.save(state);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        lockout_state: state,
      });
    });

    it('should save state with null lockoutStartedAt', async () => {
      const state = {
        failedAttempts: 2,
        lockoutStartedAt: null,
      };

      await storage.save(state);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        lockout_state: state,
      });
    });

    it('should throw error if storage fails', async () => {
      const storageError = new Error('Storage error');
      (browser.storage.local.set as jest.Mock).mockRejectedValue(storageError);

      const state = {
        failedAttempts: 1,
        lockoutStartedAt: null,
      };

      await expect(storage.save(state)).rejects.toThrow('Failed to save lockout state');
    });
  });

  describe('load', () => {
    it('should load lockout state from storage', async () => {
      const state = {
        failedAttempts: 3,
        lockoutStartedAt: Date.now(),
      };

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        lockout_state: state,
      });

      const loaded = await storage.load();

      expect(browser.storage.local.get).toHaveBeenCalledWith('lockout_state');
      expect(loaded).toEqual(state);
    });

    it('should return null if no state exists', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const loaded = await storage.load();

      expect(loaded).toBeNull();
    });

    it('should return null if state is undefined', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        lockout_state: undefined,
      });

      const loaded = await storage.load();

      expect(loaded).toBeNull();
    });

    it('should throw error if storage fails', async () => {
      const storageError = new Error('Storage error');
      (browser.storage.local.get as jest.Mock).mockRejectedValue(storageError);

      await expect(storage.load()).rejects.toThrow('Failed to load lockout state');
    });
  });

  describe('clear', () => {
    it('should remove lockout state from storage', async () => {
      await storage.clear();

      expect(browser.storage.local.remove).toHaveBeenCalledWith('lockout_state');
    });

    it('should throw error if storage fails', async () => {
      const storageError = new Error('Storage error');
      (browser.storage.local.remove as jest.Mock).mockRejectedValue(storageError);

      await expect(storage.clear()).rejects.toThrow('Failed to clear lockout state');
    });
  });

  describe('integration scenarios', () => {
    it('should handle save and load cycle', async () => {
      const state = {
        failedAttempts: 4,
        lockoutStartedAt: Date.now(),
      };

      await storage.save(state);

      // Get the saved data from the mock call
      const setCall = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
      const savedState = setCall.lockout_state;

      // Mock the get to return the saved data
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        lockout_state: savedState,
      });

      const loaded = await storage.load();

      expect(loaded).toEqual(state);
    });

    it('should handle clear after save', async () => {
      const state = {
        failedAttempts: 2,
        lockoutStartedAt: null,
      };

      await storage.save(state);
      await storage.clear();

      // Mock the get to return nothing after clear
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const loaded = await storage.load();

      expect(loaded).toBeNull();
    });

    it('should handle multiple save operations', async () => {
      const state1 = {
        failedAttempts: 1,
        lockoutStartedAt: null,
      };

      const state2 = {
        failedAttempts: 2,
        lockoutStartedAt: null,
      };

      await storage.save(state1);
      await storage.save(state2);

      // Get the last saved data
      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const lastSavedState = setCalls[setCalls.length - 1][0].lockout_state;

      expect(lastSavedState).toEqual(state2);
    });
  });
});
