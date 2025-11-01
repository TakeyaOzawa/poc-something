/**
 * MasterPasswordPolicy Entity Tests
 */

import { MasterPasswordPolicy, MasterPasswordPolicyData } from '../MasterPasswordPolicy';

describe('MasterPasswordPolicy', () => {
  describe('create', () => {
    test('デフォルト値でポリシーが作成されること', () => {
      const policy = MasterPasswordPolicy.create();
      
      expect(policy.getMinLength()).toBe(12);
      expect(policy.requiresUppercase()).toBe(true);
      expect(policy.requiresLowercase()).toBe(true);
      expect(policy.requiresNumbers()).toBe(true);
      expect(policy.requiresSymbols()).toBe(true);
      expect(policy.getMaxAttempts()).toBe(5);
      expect(policy.getLockoutDurationMinutes()).toBe(5);
      expect(policy.getAutoLockMinutes()).toBe(15);
    });
  });

  describe('fromData', () => {
    test('データからポリシーが作成されること', () => {
      const data: MasterPasswordPolicyData = {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: false,
        maxAttempts: 3,
        lockoutDurationMinutes: 10,
        autoLockMinutes: 30
      };
      
      const policy = MasterPasswordPolicy.fromData(data);
      
      expect(policy.getMinLength()).toBe(8);
      expect(policy.requiresUppercase()).toBe(false);
      expect(policy.requiresLowercase()).toBe(true);
      expect(policy.requiresNumbers()).toBe(true);
      expect(policy.requiresSymbols()).toBe(false);
      expect(policy.getMaxAttempts()).toBe(3);
      expect(policy.getLockoutDurationMinutes()).toBe(10);
      expect(policy.getAutoLockMinutes()).toBe(30);
    });
  });

  describe('validatePassword', () => {
    let policy: MasterPasswordPolicy;

    beforeEach(() => {
      policy = MasterPasswordPolicy.create();
    });

    test('有効なパスワードが検証されること', () => {
      const result = policy.validatePassword('MySecure123!');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('短すぎるパスワードが無効と判定されること', () => {
      const result = policy.validatePassword('Short1!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスワードは12文字以上である必要があります');
    });

    test('大文字が不足している場合、無効と判定されること', () => {
      const result = policy.validatePassword('mysecure123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('大文字を含む必要があります');
    });

    test('小文字が不足している場合、無効と判定されること', () => {
      const result = policy.validatePassword('MYSECURE123!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('小文字を含む必要があります');
    });

    test('数字が不足している場合、無効と判定されること', () => {
      const result = policy.validatePassword('MySecurePass!');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('数字を含む必要があります');
    });

    test('記号が不足している場合、無効と判定されること', () => {
      const result = policy.validatePassword('MySecure123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('記号を含む必要があります');
    });

    test('複数の要件が不足している場合、複数のエラーが返されること', () => {
      const result = policy.validatePassword('short');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('パスワードは12文字以上である必要があります');
      expect(result.errors).toContain('大文字を含む必要があります');
      expect(result.errors).toContain('数字を含む必要があります');
      expect(result.errors).toContain('記号を含む必要があります');
    });
  });

  describe('calculateStrength', () => {
    let policy: MasterPasswordPolicy;

    beforeEach(() => {
      policy = MasterPasswordPolicy.create();
    });

    test('強いパスワードの強度が正しく計算されること', () => {
      const result = policy.calculateStrength('MyVerySecure123!Password');
      
      expect(result.score).toBeGreaterThan(70);
      expect(['強い', '非常に強い']).toContain(result.level);
    });

    test('弱いパスワードの強度が正しく計算されること', () => {
      const result = policy.calculateStrength('weak');
      
      expect(result.score).toBeLessThan(50);
      expect(['非常に弱い', '弱い']).toContain(result.level);
    });

    test('中程度のパスワードの強度が正しく計算されること', () => {
      const result = policy.calculateStrength('Medium123!');
      
      expect(result.score).toBeGreaterThan(30);
      expect(result.score).toBeLessThan(90);
    });

    test('スコアが100を超えないこと', () => {
      const result = policy.calculateStrength('VeryVeryVerySecure123!@#$%^&*()Password');
      
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('updatePolicy', () => {
    let policy: MasterPasswordPolicy;

    beforeEach(() => {
      policy = MasterPasswordPolicy.create();
    });

    test('ポリシーが正常に更新されること', () => {
      policy.updatePolicy({
        minLength: 16,
        requireUppercase: false,
        maxAttempts: 3
      });
      
      expect(policy.getMinLength()).toBe(16);
      expect(policy.requiresUppercase()).toBe(false);
      expect(policy.getMaxAttempts()).toBe(3);
      // 他の設定は変更されないこと
      expect(policy.requiresLowercase()).toBe(true);
      expect(policy.requiresNumbers()).toBe(true);
    });

    test('無効な最小長が設定された場合、エラーが発生すること', () => {
      expect(() => {
        policy.updatePolicy({ minLength: 7 });
      }).toThrow('最小長は8文字以上である必要があります');
    });

    test('無効な最大試行回数が設定された場合、エラーが発生すること', () => {
      expect(() => {
        policy.updatePolicy({ maxAttempts: 0 });
      }).toThrow('最大試行回数は1回以上である必要があります');
    });

    test('無効なロックアウト時間が設定された場合、エラーが発生すること', () => {
      expect(() => {
        policy.updatePolicy({ lockoutDurationMinutes: 0 });
      }).toThrow('ロックアウト時間は1分以上である必要があります');
    });

    test('無効な自動ロック時間が設定された場合、エラーが発生すること', () => {
      expect(() => {
        policy.updatePolicy({ autoLockMinutes: 0 });
      }).toThrow('自動ロック時間は1分以上である必要があります');
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const policy = MasterPasswordPolicy.create();
      policy.updatePolicy({ minLength: 16, maxAttempts: 3 });
      
      const data = policy.toData();
      
      expect(data.minLength).toBe(16);
      expect(data.maxAttempts).toBe(3);
      expect(data.requireUppercase).toBe(true);
      expect(data.requireLowercase).toBe(true);
      expect(data.requireNumbers).toBe(true);
      expect(data.requireSymbols).toBe(true);
      expect(data.lockoutDurationMinutes).toBe(5);
      expect(data.autoLockMinutes).toBe(15);
    });
  });
});
