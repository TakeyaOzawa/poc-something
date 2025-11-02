export class MockSecureStorage {
  private data = new Map<string, unknown>();
  public isUnlockedState = true;
  public sessionTimeout = 3600000; // 1 hour
  public unlockCalled = false;
  public unlockPassword = '';
  public lockCalled = false;
  public shouldUnlockFail = false;

  reset(): void {
    this.data.clear();
    this.isUnlockedState = true;
    this.unlockCalled = false;
    this.unlockPassword = '';
    this.lockCalled = false;
    this.shouldUnlockFail = false;
    this.sessionTimeout = 3600000;
  }

  async get(key: string): Promise<unknown> {
    return this.data.get(key);
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  async isUnlocked(): Promise<boolean> {
    return this.isUnlockedState;
  }

  async lock(): Promise<void> {
    this.lockCalled = true;
    this.isUnlockedState = false;
  }

  async unlock(password?: string): Promise<boolean> {
    if (password) {
      this.unlockCalled = true;
      this.unlockPassword = password;
      
      // Only fail for explicitly wrong passwords
      if (password === 'WrongPassword' || this.shouldUnlockFail) {
        throw new Error('Invalid password');
      }
    }
    
    this.isUnlockedState = true;
    return true;
  }

  async unlockWithPassword(password: string): Promise<boolean> {
    this.unlockCalled = true;
    this.unlockPassword = password;
    
    if (this.shouldUnlockFail || password === 'WrongPassword') {
      return false;
    }
    
    this.isUnlockedState = true;
    return true;
  }

  setUnlocked(state: boolean): void {
    this.isUnlockedState = state;
  }

  setSessionTimeout(timeout: number): void {
    this.sessionTimeout = timeout;
  }

  getSessionTimeout(): number {
    return this.sessionTimeout;
  }

  getSessionExpiresAt(): number | null {
    if (!this.isUnlockedState) return null;
    return Date.now() + this.sessionTimeout;
  }

  setShouldUnlockFail(shouldFail: boolean): void {
    this.shouldUnlockFail = shouldFail;
  }

  setThrowError(shouldThrow: boolean): void {
    this.shouldUnlockFail = shouldThrow;
  }

  async saveEncrypted(key: string, data: unknown): Promise<void> {
    this.data.set(key, data);
  }

  async loadEncrypted(key: string): Promise<unknown> {
    return this.data.get(key);
  }
}
