/**
 * Unit Tests: SecureStorageAdapter
 */

import { SecureStorageAdapter } from '../SecureStorageAdapter';
import { WebCryptoAdapter } from '../CryptoAdapter';
import browser from 'webextension-polyfill';

// Mock browser.alarms
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
    alarms: {
      create: jest.fn(),
      clear: jest.fn(),
    },
  },
}));

describe('SecureStoragePort', () => {
  let service: SecureStorageAdapter;
  const testPassword = 'TestPassword123!@#';
  const weakPassword = 'weak';

  beforeEach(() => {
    const cryptoAdapter = new WebCryptoAdapter();
    service = new SecureStorageAdapter(cryptoAdapter);
    jest.clearAllMocks();

    // Reset mock implementations
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});
    (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
    (browser.storage.local.remove as jest.Mock).mockResolvedValue(undefined);
    (browser.alarms.clear as jest.Mock).mockResolvedValue(true);
    (browser.alarms.create as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // Ensure service is locked after each test
    service.lock();
  });

  describe('isInitialized', () => {
    it('should return false when not initialized', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await service.isInitialized();

      expect(result).toBe(false);
      expect(browser.storage.local.get).toHaveBeenCalledWith('master_password_hash');
    });

    it('should return true when initialized', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        master_password_hash: { ciphertext: 'xxx', iv: 'yyy', salt: 'zzz' },
      });

      const result = await service.isInitialized();

      expect(result).toBe(true);
    });
  });

  describe('initialize', () => {
    it('should initialize with valid password', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      await service.initialize(testPassword);

      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          master_password_hash: expect.objectContaining({
            ciphertext: expect.any(String),
            iv: expect.any(String),
            salt: expect.any(String),
          }),
        })
      );
      expect(service.isUnlocked()).toBe(true);
    });

    it('should throw error if password is too short', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      await expect(service.initialize(weakPassword)).rejects.toThrow(
        'Password must be at least 8 characters'
      );

      expect(service.isUnlocked()).toBe(false);
    });

    it('should throw error if already initialized', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        master_password_hash: { ciphertext: 'xxx', iv: 'yyy', salt: 'zzz' },
      });

      await expect(service.initialize(testPassword)).rejects.toThrow(
        'Master password already initialized'
      );
    });

    it('should start session after initialization', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      await service.initialize(testPassword);

      // Session is managed by SessionManager now, not browser.alarms
      expect(service.isUnlocked()).toBe(true);
      expect(service.getSessionExpiresAt()).not.toBeNull();
    });
  });

  describe('unlock', () => {
    let savedPasswordHash: any;

    beforeEach(async () => {
      // Initialize first and save the password hash before clearing mocks
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);

      // Save the password hash from the set call
      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      savedPasswordHash = setCalls[0][0].master_password_hash;

      service.lock();
      jest.clearAllMocks();
    });

    it('should unlock with correct password', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        master_password_hash: savedPasswordHash,
      });

      await service.unlock(testPassword);

      expect(service.isUnlocked()).toBe(true);
    });

    it('should throw error with wrong password', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        master_password_hash: savedPasswordHash,
      });

      await expect(service.unlock('WrongPassword123!')).rejects.toThrow(
        'Invalid password or corrupted data'
      );

      expect(service.isUnlocked()).toBe(false);
    });

    it('should throw error if not initialized', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      await expect(service.unlock(testPassword)).rejects.toThrow('Master password not initialized');
    });

    it('should start session after unlock', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        master_password_hash: savedPasswordHash,
      });

      await service.unlock(testPassword);

      // Session is managed by SessionManager now
      expect(service.isUnlocked()).toBe(true);
      expect(service.getSessionExpiresAt()).not.toBeNull();
    });
  });

  describe('lock', () => {
    beforeEach(async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);
      jest.clearAllMocks();
    });

    it('should lock the storage', () => {
      expect(service.isUnlocked()).toBe(true);

      service.lock();

      expect(service.isUnlocked()).toBe(false);
    });

    it('should clear alarms', () => {
      service.lock();

      expect(browser.alarms.clear).toHaveBeenCalledWith('secure-storage-session');
    });
  });

  describe('isUnlocked', () => {
    it('should return false when locked', () => {
      expect(service.isUnlocked()).toBe(false);
    });

    it('should return true when unlocked', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);

      expect(service.isUnlocked()).toBe(true);
    });
  });

  describe('getSessionExpiresAt', () => {
    it('should return null when locked', () => {
      expect(service.getSessionExpiresAt()).toBeNull();
    });

    it('should return expiration time when unlocked', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);

      const expiresAt = service.getSessionExpiresAt();

      expect(expiresAt).not.toBeNull();
      expect(expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('extendSession', () => {
    beforeEach(async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);
      jest.clearAllMocks();

      // Ensure alarms.clear returns a resolved promise
      (browser.alarms.clear as jest.Mock).mockResolvedValue(true);
    });

    it('should extend session when unlocked', async () => {
      const initialExpiresAt = service.getSessionExpiresAt();

      // Wait at least 1ms to ensure Date.now() returns a different value
      await new Promise((resolve) => setTimeout(resolve, 10));

      service.extendSession();

      const newExpiresAt = service.getSessionExpiresAt();

      // Session should be extended (new expiration time should be later)
      expect(newExpiresAt).toBeGreaterThan(initialExpiresAt!);
      expect(service.isUnlocked()).toBe(true);
    });

    it('should do nothing when locked', () => {
      service.lock();

      const expiresAt = service.getSessionExpiresAt();
      service.extendSession();

      // Session should remain locked
      expect(service.isUnlocked()).toBe(false);
      expect(service.getSessionExpiresAt()).toBeNull();
    });
  });

  describe('saveEncrypted and loadEncrypted', () => {
    beforeEach(async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);
      jest.clearAllMocks();
    });

    it('should save and load encrypted data', async () => {
      const testData = { name: 'Test', value: 123 };

      await service.saveEncrypted('test-key', testData);

      // Get the encrypted data that was saved
      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const savedData = setCalls[0][0];

      // Mock the get to return the saved data
      (browser.storage.local.get as jest.Mock).mockResolvedValue(savedData);

      const loaded = await service.loadEncrypted('test-key');

      expect(loaded).toEqual(testData);
    });

    it('should return null when data does not exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const loaded = await service.loadEncrypted('non-existent');

      expect(loaded).toBeNull();
    });

    it('should throw error when saving while locked', async () => {
      service.lock();

      await expect(service.saveEncrypted('test-key', { data: 'test' })).rejects.toThrow(
        'Storage is locked'
      );
    });

    it('should throw error when loading while locked', async () => {
      service.lock();

      await expect(service.loadEncrypted('test-key')).rejects.toThrow('Storage is locked');
    });

    it('should handle complex nested objects', async () => {
      const complexData = {
        users: [
          { id: 1, name: 'User 1', active: true },
          { id: 2, name: 'User 2', active: false },
        ],
        settings: {
          theme: 'dark',
          notifications: { email: true, push: false },
        },
      };

      await service.saveEncrypted('complex', complexData);

      const setCalls = (browser.storage.local.set as jest.Mock).mock.calls;
      const savedData = setCalls[0][0];
      (browser.storage.local.get as jest.Mock).mockResolvedValue(savedData);

      const loaded = await service.loadEncrypted('complex');

      expect(loaded).toEqual(complexData);
    });
  });

  describe('removeEncrypted', () => {
    it('should remove encrypted data', async () => {
      await service.removeEncrypted('test-key');

      expect(browser.storage.local.remove).toHaveBeenCalledWith('secure_test-key');
    });
  });

  describe('clearAllEncrypted', () => {
    it('should clear all encrypted data', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        secure_key1: { encrypted: 'data1' },
        secure_key2: { encrypted: 'data2' },
        other_key: 'other_data',
        master_password_hash: { hash: 'xxx' },
      });

      await service.clearAllEncrypted();

      expect(browser.storage.local.remove).toHaveBeenCalledWith(['secure_key1', 'secure_key2']);
    });
  });

  describe('changeMasterPassword', () => {
    let savedPasswordHash: any;
    let savedData1: any;
    let savedData2: any;

    beforeEach(async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);

      // Save the password hash
      const initSetCall = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
      savedPasswordHash = initSetCall.master_password_hash;

      // Save some test data
      await service.saveEncrypted('data1', { value: 'test1' });
      await service.saveEncrypted('data2', { value: 'test2' });

      // Save the encrypted data
      const data1SetCall = (browser.storage.local.set as jest.Mock).mock.calls[1][0];
      const data2SetCall = (browser.storage.local.set as jest.Mock).mock.calls[2][0];
      savedData1 = data1SetCall.secure_data1;
      savedData2 = data2SetCall.secure_data2;

      jest.clearAllMocks();
    });

    it('should change master password and re-encrypt data', async () => {
      const newPassword = 'NewPassword456$%^';

      // Mock get to return all stored data
      const mockStorageData = {
        master_password_hash: savedPasswordHash,
        secure_data1: savedData1,
        secure_data2: savedData2,
      };

      (browser.storage.local.get as jest.Mock).mockResolvedValue(mockStorageData);

      await service.changeMasterPassword(testPassword, newPassword);

      // Verify new password hash was saved
      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          master_password_hash: expect.any(Object),
        })
      );

      // Verify data was re-encrypted
      expect(browser.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          secure_data1: expect.any(Object),
        })
      );

      expect(service.isUnlocked()).toBe(true);
    });

    it('should throw error if new password is too short', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        master_password_hash: {},
        secure_data1: {},
      });

      await expect(service.changeMasterPassword(testPassword, weakPassword)).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);
      jest.clearAllMocks();
    });

    it('should reset and clear all data', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        secure_key1: {},
        secure_key2: {},
        other_key: {},
      });

      await service.reset();

      expect(browser.storage.local.remove).toHaveBeenCalledWith(['secure_key1', 'secure_key2']);
      expect(browser.storage.local.remove).toHaveBeenCalledWith('master_password_hash');
      expect(service.isUnlocked()).toBe(false);
    });
  });

  describe('session timeout', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-lock after session timeout', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);

      expect(service.isUnlocked()).toBe(true);

      // Fast-forward time by 15 minutes
      jest.advanceTimersByTime(15 * 60 * 1000);

      expect(service.isUnlocked()).toBe(false);
    });

    it('should not auto-lock before timeout', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      await service.initialize(testPassword);

      expect(service.isUnlocked()).toBe(true);

      // Fast-forward time by 10 minutes
      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(service.isUnlocked()).toBe(true);
    });
  });
});
