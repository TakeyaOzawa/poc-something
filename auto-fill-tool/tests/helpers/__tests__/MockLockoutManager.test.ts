/**
 * Test: MockLockoutManager
 * 
 * カバレッジ目標: 90%以上
 * テスト対象: テストヘルパーのMockLockoutManagerクラス
 */

import { MockLockoutManager } from '../MockLockoutManager';

describe('MockLockoutManager', () => {
  let mockManager: MockLockoutManager;

  beforeEach(() => {
    mockManager = new MockLockoutManager();
  });

  describe('初期化とデフォルト状態', () => {
    it('デフォルト状態が正しく設定されること', () => {
      expect(mockManager.isLockedOutState).toBe(false);
      expect(mockManager.failedAttempts).toBe(0);
      expect(mockManager.remainingAttempts).toBe(5);
      expect(mockManager.lockoutStartedAt).toBeNull();
      expect(mockManager.resetCalled).toBe(false);
      expect(mockManager.recordFailedAttemptCalled).toBe(false);
      expect(mockManager.recordSuccessfulAttemptCalled).toBe(false);
    });

    it('lockoutExpiryがデフォルトで5分後に設定されること', () => {
      const now = Date.now();
      const expectedExpiry = now + 300000; // 5 minutes
      const actualExpiry = mockManager.lockoutExpiry.getTime();
      
      // 実行時間の誤差を考慮して±1秒の範囲で検証
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('ロックアウト状態の確認', () => {
    it('isLockedOut()でロックアウト状態を返すこと', async () => {
      expect(await mockManager.isLockedOut()).toBe(false);
      
      mockManager.setLockedOut(true);
      expect(await mockManager.isLockedOut()).toBe(true);
    });

    it('getRemainingAttempts()で残り試行回数を返すこと', async () => {
      expect(await mockManager.getRemainingAttempts()).toBe(5);
      
      mockManager.setRemainingAttempts(3);
      expect(await mockManager.getRemainingAttempts()).toBe(3);
    });
  });

  describe('ステータス取得', () => {
    it('getStatus()でロックアウトされていない場合の正しいステータスを返すこと', async () => {
      mockManager.failedAttempts = 2;
      
      const status = await mockManager.getStatus();
      
      expect(status.isLockedOut).toBe(false);
      expect(status.failedAttempts).toBe(2);
      expect(status.lockoutStartedAt).toBeNull();
      expect(status.lockoutEndsAt).toBeNull();
      expect(status.remainingLockoutTime).toBe(0);
    });

    it('getStatus()でロックアウトされている場合の正しいステータスを返すこと', async () => {
      const lockoutTime = Date.now();
      const expiry = new Date(lockoutTime + 300000);
      
      mockManager.setLockedOut(true);
      mockManager.setLockoutExpiry(expiry);
      mockManager.failedAttempts = 5;
      mockManager.lockoutStartedAt = lockoutTime;
      
      const status = await mockManager.getStatus();
      
      expect(status.isLockedOut).toBe(true);
      expect(status.failedAttempts).toBe(5);
      expect(status.lockoutStartedAt).toBe(lockoutTime);
      expect(status.lockoutEndsAt).toBe(expiry.getTime());
      expect(status.remainingLockoutTime).toBeGreaterThan(0);
      expect(status.remainingLockoutTime).toBeLessThanOrEqual(300000);
    });

    it('getStatus()でロックアウト期限が過ぎている場合、remainingLockoutTimeが0になること', async () => {
      const pastExpiry = new Date(Date.now() - 1000); // 1秒前
      
      mockManager.setLockedOut(true);
      mockManager.setLockoutExpiry(pastExpiry);
      
      const status = await mockManager.getStatus();
      
      expect(status.remainingLockoutTime).toBe(0);
    });
  });

  describe('試行記録', () => {
    it('recordFailedAttempt()で失敗試行が記録されること', async () => {
      await mockManager.recordFailedAttempt();
      
      expect(mockManager.recordFailedAttemptCalled).toBe(true);
      expect(mockManager.failedAttempts).toBe(1);
    });

    it('recordFailedAttempt()を複数回呼び出すと失敗回数が累積されること', async () => {
      await mockManager.recordFailedAttempt();
      await mockManager.recordFailedAttempt();
      await mockManager.recordFailedAttempt();
      
      expect(mockManager.failedAttempts).toBe(3);
    });

    it('recordSuccessfulAttempt()で成功試行が記録され状態がリセットされること', async () => {
      // 事前に失敗状態を設定
      mockManager.failedAttempts = 3;
      mockManager.setLockedOut(true);
      mockManager.lockoutStartedAt = Date.now();
      
      await mockManager.recordSuccessfulAttempt();
      
      expect(mockManager.recordSuccessfulAttemptCalled).toBe(true);
      expect(mockManager.failedAttempts).toBe(0);
      expect(mockManager.isLockedOutState).toBe(false);
      expect(mockManager.lockoutStartedAt).toBeNull();
    });
  });

  describe('リセット機能', () => {
    it('reset()で状態がリセットされること', async () => {
      // 事前に状態を設定
      mockManager.failedAttempts = 5;
      mockManager.setLockedOut(true);
      mockManager.lockoutStartedAt = Date.now();
      
      await mockManager.reset();
      
      expect(mockManager.resetCalled).toBe(true);
      expect(mockManager.failedAttempts).toBe(0);
      expect(mockManager.isLockedOutState).toBe(false);
      expect(mockManager.lockoutStartedAt).toBeNull();
    });
  });

  describe('ヘルパーメソッド', () => {
    it('setLockedOut()でロックアウト状態が設定されること', () => {
      mockManager.setLockedOut(true);
      
      expect(mockManager.isLockedOutState).toBe(true);
      expect(mockManager.lockoutStartedAt).not.toBeNull();
    });

    it('setLockedOut(false)でロックアウト状態が解除されること', () => {
      mockManager.setLockedOut(true);
      mockManager.setLockedOut(false);
      
      expect(mockManager.isLockedOutState).toBe(false);
      // lockoutStartedAtは変更されない（一度設定されたら保持）
    });

    it('setLockedOut(true)を複数回呼び出してもlockoutStartedAtは最初の値を保持すること', () => {
      const firstCall = Date.now();
      mockManager.setLockedOut(true);
      const firstStartedAt = mockManager.lockoutStartedAt;
      
      // 少し待ってから再度呼び出し
      setTimeout(() => {
        mockManager.setLockedOut(true);
        expect(mockManager.lockoutStartedAt).toBe(firstStartedAt);
      }, 10);
    });

    it('setRemainingAttempts()で残り試行回数が設定されること', () => {
      mockManager.setRemainingAttempts(10);
      
      expect(mockManager.remainingAttempts).toBe(10);
    });

    it('setLockoutExpiry()でロックアウト期限が設定されること', () => {
      const newExpiry = new Date(Date.now() + 600000); // 10分後
      
      mockManager.setLockoutExpiry(newExpiry);
      
      expect(mockManager.lockoutExpiry).toBe(newExpiry);
    });

    it('resetTracking()でトラッキング状態がリセットされること', () => {
      // 事前に状態を設定
      mockManager.resetCalled = true;
      mockManager.recordFailedAttemptCalled = true;
      mockManager.recordSuccessfulAttemptCalled = true;
      mockManager.failedAttempts = 3;
      
      mockManager.resetTracking();
      
      expect(mockManager.resetCalled).toBe(false);
      expect(mockManager.recordFailedAttemptCalled).toBe(false);
      expect(mockManager.recordSuccessfulAttemptCalled).toBe(false);
      expect(mockManager.failedAttempts).toBe(0);
    });
  });
});
