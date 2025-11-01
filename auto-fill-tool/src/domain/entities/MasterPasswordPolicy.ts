/**
 * MasterPasswordPolicy Entity
 * マスターパスワードポリシーを管理するドメインエンティティ
 */

export interface MasterPasswordPolicyData {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAttempts: number;
  lockoutDurationMinutes: number;
  autoLockMinutes: number;
}

export class MasterPasswordPolicy {
  private data: MasterPasswordPolicyData;

  constructor(data?: Partial<MasterPasswordPolicyData>) {
    this.data = {
      minLength: data?.minLength ?? 12,
      requireUppercase: data?.requireUppercase ?? true,
      requireLowercase: data?.requireLowercase ?? true,
      requireNumbers: data?.requireNumbers ?? true,
      requireSymbols: data?.requireSymbols ?? true,
      maxAttempts: data?.maxAttempts ?? 5,
      lockoutDurationMinutes: data?.lockoutDurationMinutes ?? 5,
      autoLockMinutes: data?.autoLockMinutes ?? 15
    };
  }

  static create(): MasterPasswordPolicy {
    return new MasterPasswordPolicy();
  }

  static fromData(data: MasterPasswordPolicyData): MasterPasswordPolicy {
    return new MasterPasswordPolicy(data);
  }

  getMinLength(): number {
    return this.data.minLength;
  }

  requiresUppercase(): boolean {
    return this.data.requireUppercase;
  }

  requiresLowercase(): boolean {
    return this.data.requireLowercase;
  }

  requiresNumbers(): boolean {
    return this.data.requireNumbers;
  }

  requiresSymbols(): boolean {
    return this.data.requireSymbols;
  }

  getMaxAttempts(): number {
    return this.data.maxAttempts;
  }

  getLockoutDurationMinutes(): number {
    return this.data.lockoutDurationMinutes;
  }

  getAutoLockMinutes(): number {
    return this.data.autoLockMinutes;
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.data.minLength) {
      errors.push(`パスワードは${this.data.minLength}文字以上である必要があります`);
    }

    if (this.data.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('大文字を含む必要があります');
    }

    if (this.data.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('小文字を含む必要があります');
    }

    if (this.data.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('数字を含む必要があります');
    }

    if (this.data.requireSymbols && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('記号を含む必要があります');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  calculateStrength(password: string): { score: number; level: string } {
    let score = 0;

    // 長さによるスコア
    if (password.length >= this.data.minLength) score += 25;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // 文字種によるスコア
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 20;

    // エントロピーによるスコア（Shannon entropy）
    const entropy = this.calculateEntropy(password);
    if (entropy >= 3.5) score += 10;
    if (entropy >= 4.0) score += 10;

    let level: string;
    if (score >= 90) level = '非常に強い';
    else if (score >= 70) level = '強い';
    else if (score >= 50) level = '普通';
    else if (score >= 30) level = '弱い';
    else level = '非常に弱い';

    return { score: Math.min(100, score), level };
  }

  updatePolicy(updates: Partial<MasterPasswordPolicyData>): void {
    if (updates.minLength !== undefined && updates.minLength < 8) {
      throw new Error('最小長は8文字以上である必要があります');
    }
    if (updates.maxAttempts !== undefined && updates.maxAttempts < 1) {
      throw new Error('最大試行回数は1回以上である必要があります');
    }
    if (updates.lockoutDurationMinutes !== undefined && updates.lockoutDurationMinutes < 1) {
      throw new Error('ロックアウト時間は1分以上である必要があります');
    }
    if (updates.autoLockMinutes !== undefined && updates.autoLockMinutes < 1) {
      throw new Error('自動ロック時間は1分以上である必要があります');
    }

    this.data = { ...this.data, ...updates };
  }

  toData(): MasterPasswordPolicyData {
    return { ...this.data };
  }

  private calculateEntropy(password: string): number {
    const charCounts = new Map<string, number>();
    for (const char of password) {
      charCounts.set(char, (charCounts.get(char) || 0) + 1);
    }

    let entropy = 0;
    const length = password.length;
    for (const count of charCounts.values()) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }
}
