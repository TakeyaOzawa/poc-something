/**
 * Test: MockSecureStorage
 * 
 * カバレッジ目標: 90%以上
 * テスト対象: テストヘルパーのMockSecureStorageクラス
 */

import { MockSecureStorage } from '../MockSecureStorage';

describe('MockSecureStorage', () => {
  let mockStorage: MockSecureStorage;

  beforeEach(() => {
    mockStorage = new MockSecureStorage();
  });

  describe('初期化とセットアップ', () => {
    it('デフォルト状態が正しく設定されること', () => {
      expect(mockStorage.isUnlockedState).toBe(false);
      expect(mockStorage.sessionTimeout).toBe(3600000);
      expect(mockStorage.isInitializedState).toBe(true);
      expect(mockStorage.unlockCalled).toBe(false);
      expect(mockStorage.lockCalled).toBe(false);
      expect(mockStorage.shouldThrowError).toBe(false);
      expect(mockStorage.errorMessage).toBe('Invalid password');
    });

    it('initialize()でisInitializedStateがtrueに設定されること', async () => {
      mockStorage.setInitialized(false);
      
      await mockStorage.initialize('password123');
      
      expect(mockStorage.isInitializedState).toBe(true);
    });

    it('isInitialized()がisInitializedStateの値を返すこと', async () => {
      mockStorage.setInitialized(false);
      expect(await mockStorage.isInitialized()).toBe(false);
      
      mockStorage.setInitialized(true);
      expect(await mockStorage.isInitialized()).toBe(true);
    });
  });

  describe('ロック・アンロック機能', () => {
    it('unlock()で正常にアンロックされること', async () => {
      await mockStorage.unlock('password123');
      
      expect(mockStorage.unlockCalled).toBe(true);
      expect(mockStorage.unlockPassword).toBe('password123');
      expect(mockStorage.isUnlockedState).toBe(true);
      expect(mockStorage.isUnlocked()).toBe(true);
    });

    it('unlock()でエラーが設定されている場合、例外がthrowされること', async () => {
      mockStorage.setThrowError(true, 'Custom error message');
      
      await expect(mockStorage.unlock('password123')).rejects.toThrow('Custom error message');
      expect(mockStorage.unlockCalled).toBe(true);
      expect(mockStorage.unlockPassword).toBe('password123');
    });

    it('lock()で正常にロックされること', () => {
      mockStorage.setUnlocked(true);
      
      mockStorage.lock();
      
      expect(mockStorage.lockCalled).toBe(true);
      expect(mockStorage.isUnlockedState).toBe(false);
      expect(mockStorage.isUnlocked()).toBe(false);
    });

    it('lock()でエラーが設定されている場合、例外がthrowされること', () => {
      mockStorage.setThrowError(true, 'Lock error');
      
      expect(() => mockStorage.lock()).toThrow('Lock error');
      expect(mockStorage.lockCalled).toBe(true);
    });
  });

  describe('セッション管理', () => {
    it('getSessionExpiresAt()でアンロック時に有効期限を返すこと', () => {
      const beforeTime = Date.now();
      mockStorage.setUnlocked(true);
      
      const expiresAt = mockStorage.getSessionExpiresAt();
      
      expect(expiresAt).not.toBeNull();
      expect(expiresAt!).toBeGreaterThan(beforeTime);
      expect(expiresAt!).toBeLessThanOrEqual(Date.now() + mockStorage.sessionTimeout + 100);
    });

    it('getSessionExpiresAt()でロック時にnullを返すこと', () => {
      mockStorage.setUnlocked(false);
      
      const expiresAt = mockStorage.getSessionExpiresAt();
      
      expect(expiresAt).toBeNull();
    });

    it('extendSession()が正常に実行されること（no-op）', () => {
      expect(() => mockStorage.extendSession()).not.toThrow();
    });

    it('getSessionTimeout()でセッションタイムアウト値を返すこと', () => {
      expect(mockStorage.getSessionTimeout()).toBe(3600000);
      
      mockStorage.setSessionTimeout(7200000);
      expect(mockStorage.getSessionTimeout()).toBe(7200000);
    });
  });

  describe('暗号化ストレージ操作', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('saveEncrypted()でデータが保存されること', async () => {
      const testData = { key: 'value' };
      
      await mockStorage.saveEncrypted('testKey', testData);
      
      expect(mockStorage.saveEncrypted).toHaveBeenCalledWith('testKey', testData);
    });

    it('saveEncrypted()でロック時に例外がthrowされること', async () => {
      mockStorage.setUnlocked(false);
      
      await expect(mockStorage.saveEncrypted('testKey', 'data')).rejects.toThrow('Storage is locked');
    });

    it('loadEncrypted()でデータが読み込まれること', async () => {
      const result = await mockStorage.loadEncrypted('testKey');
      
      expect(mockStorage.loadEncrypted).toHaveBeenCalledWith('testKey');
    });

    it('loadEncrypted()でロック時に例外がthrowされること', async () => {
      mockStorage.setUnlocked(false);
      
      await expect(mockStorage.loadEncrypted('testKey')).rejects.toThrow('Storage is locked');
    });

    it('removeEncrypted()でデータが削除されること', async () => {
      await mockStorage.removeEncrypted('testKey');
      
      expect(mockStorage.removeEncrypted).toHaveBeenCalledWith('testKey');
    });

    it('removeEncrypted()でロック時に例外がthrowされること', async () => {
      mockStorage.setUnlocked(false);
      
      await expect(mockStorage.removeEncrypted('testKey')).rejects.toThrow('Storage is locked');
    });

    it('clearAllEncrypted()で全データがクリアされること', async () => {
      await expect(mockStorage.clearAllEncrypted()).resolves.not.toThrow();
    });

    it('clearAllEncrypted()でロック時に例外がthrowされること', async () => {
      mockStorage.setUnlocked(false);
      
      await expect(mockStorage.clearAllEncrypted()).rejects.toThrow('Storage is locked');
    });

    it('changeMasterPassword()が正常に実行されること（no-op）', async () => {
      await expect(mockStorage.changeMasterPassword('old', 'new')).resolves.not.toThrow();
    });

    it('changeMasterPassword()でロック時に例外がthrowされること', async () => {
      mockStorage.setUnlocked(false);
      
      await expect(mockStorage.changeMasterPassword('old', 'new')).rejects.toThrow('Storage is locked');
    });
  });

  describe('リセット機能', () => {
    it('reset()で状態がリセットされること', async () => {
      mockStorage.setUnlocked(true);
      mockStorage.setInitialized(true);
      
      await mockStorage.reset();
      
      expect(mockStorage.isUnlockedState).toBe(false);
      expect(mockStorage.isInitializedState).toBe(false);
    });
  });

  describe('ヘルパーメソッド', () => {
    it('setSessionTimeout()でタイムアウト値が設定されること', () => {
      mockStorage.setSessionTimeout(7200000);
      
      expect(mockStorage.sessionTimeout).toBe(7200000);
    });

    it('setThrowError()でエラー設定が変更されること', () => {
      mockStorage.setThrowError(true, 'Custom error');
      
      expect(mockStorage.shouldThrowError).toBe(true);
      expect(mockStorage.errorMessage).toBe('Custom error');
    });

    it('setThrowError()でメッセージ省略時にデフォルトメッセージが保持されること', () => {
      mockStorage.setThrowError(true);
      
      expect(mockStorage.shouldThrowError).toBe(true);
      expect(mockStorage.errorMessage).toBe('Invalid password');
    });

    it('setUnlocked()でアンロック状態が設定されること', () => {
      mockStorage.setUnlocked(true);
      expect(mockStorage.isUnlockedState).toBe(true);
      
      mockStorage.setUnlocked(false);
      expect(mockStorage.isUnlockedState).toBe(false);
    });

    it('setInitialized()で初期化状態が設定されること', () => {
      mockStorage.setInitialized(false);
      expect(mockStorage.isInitializedState).toBe(false);
      
      mockStorage.setInitialized(true);
      expect(mockStorage.isInitializedState).toBe(true);
    });

    it('resetTracking()でトラッキング状態がリセットされること', () => {
      // 状態を変更
      mockStorage.unlockCalled = true;
      mockStorage.unlockPassword = 'test';
      mockStorage.lockCalled = true;
      mockStorage.shouldThrowError = true;
      mockStorage.errorMessage = 'Custom error';
      mockStorage.saveEncrypted('key', 'value');
      
      mockStorage.resetTracking();
      
      expect(mockStorage.unlockCalled).toBe(false);
      expect(mockStorage.unlockPassword).toBe('');
      expect(mockStorage.lockCalled).toBe(false);
      expect(mockStorage.shouldThrowError).toBe(false);
      expect(mockStorage.errorMessage).toBe('Invalid password');
      expect(mockStorage.saveEncrypted).toHaveBeenCalledTimes(0);
      expect(mockStorage.loadEncrypted).toHaveBeenCalledTimes(0);
      expect(mockStorage.removeEncrypted).toHaveBeenCalledTimes(0);
    });
  });
});
