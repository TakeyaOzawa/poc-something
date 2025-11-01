/**
 * CheckerState Entity
 * チェッカー状態を管理するドメインエンティティ
 */

export type CheckerStatus = 'IDLE' | 'CHECKING' | 'SUCCESS' | 'FAILED';

export interface CheckerStateData {
  id: string;
  websiteId: string;
  status: CheckerStatus;
  lastCheckedAt: string | undefined;
  nextCheckAt: string | undefined;
  checkInterval: number;
  errorMessage: string | undefined;
  successCount: number;
  failureCount: number;
}

export class CheckerState {
  private data: CheckerStateData;

  constructor(data: CheckerStateData) {
    this.data = { ...data };
  }

  static create(websiteId: string, checkInterval: number = 300000): CheckerState {
    return new CheckerState({
      id: 'cs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      websiteId,
      status: 'IDLE',
      lastCheckedAt: undefined,
      nextCheckAt: undefined,
      checkInterval,
      errorMessage: undefined,
      successCount: 0,
      failureCount: 0
    });
  }

  static fromData(data: CheckerStateData): CheckerState {
    return new CheckerState(data);
  }

  getId(): string {
    return this.data.id;
  }

  getWebsiteId(): string {
    return this.data.websiteId;
  }

  getStatus(): CheckerStatus {
    return this.data.status;
  }

  getLastCheckedAt(): string | undefined {
    return this.data.lastCheckedAt;
  }

  getNextCheckAt(): string | undefined {
    return this.data.nextCheckAt;
  }

  getCheckInterval(): number {
    return this.data.checkInterval;
  }

  getErrorMessage(): string | undefined {
    return this.data.errorMessage;
  }

  getSuccessCount(): number {
    return this.data.successCount;
  }

  getFailureCount(): number {
    return this.data.failureCount;
  }

  isIdle(): boolean {
    return this.data.status === 'IDLE';
  }

  isChecking(): boolean {
    return this.data.status === 'CHECKING';
  }

  startCheck(): void {
    if (this.data.status === 'CHECKING') {
      throw new Error('チェックは既に実行中です');
    }
    
    this.data.status = 'CHECKING';
    this.data.lastCheckedAt = new Date().toISOString();
    this.data.errorMessage = undefined;
  }

  markSuccess(): void {
    this.data.status = 'SUCCESS';
    this.data.successCount++;
    this.data.errorMessage = undefined;
    this.scheduleNextCheck();
  }

  markFailure(errorMessage: string): void {
    this.data.status = 'FAILED';
    this.data.failureCount++;
    this.data.errorMessage = errorMessage;
    this.scheduleNextCheck();
  }

  updateInterval(interval: number): void {
    if (interval < 60000) {
      throw new Error('チェック間隔は1分以上である必要があります');
    }
    
    this.data.checkInterval = interval;
    if (this.data.status !== 'CHECKING') {
      this.scheduleNextCheck();
    }
  }

  private scheduleNextCheck(): void {
    const nextCheck = new Date(Date.now() + this.data.checkInterval);
    this.data.nextCheckAt = nextCheck.toISOString();
  }

  toData(): CheckerStateData {
    return { ...this.data };
  }
}
