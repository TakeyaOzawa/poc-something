/**
 * AutomationResult Entity
 * 自動化実行結果を管理するドメインエンティティ
 */

export type AutomationStatus = 'DOING' | 'SUCCESS' | 'FAILED';

export interface AutomationResultData {
  id: string;
  automationVariablesId: string;
  websiteId: string;
  status: AutomationStatus;
  startedAt: string;
  completedAt: string | undefined;
  errorMessage: string | undefined;
  executedSteps: number;
  totalSteps: number;
  currentStepIndex: number | undefined;
  lastExecutedUrl: string | undefined;
}

export class AutomationResult {
  private data: AutomationResultData;

  constructor(data: AutomationResultData) {
    this.data = { ...data };
  }

  static create(automationVariablesId: string, websiteId: string, totalSteps: number): AutomationResult {
    return new AutomationResult({
      id: 'ar_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11),
      automationVariablesId,
      websiteId,
      status: 'DOING',
      startedAt: new Date().toISOString(),
      completedAt: undefined,
      errorMessage: undefined,
      executedSteps: 0,
      totalSteps,
      currentStepIndex: 0,
      lastExecutedUrl: undefined,
    });
  }

  static fromData(data: AutomationResultData): AutomationResult {
    return new AutomationResult(data);
  }

  getId(): string {
    return this.data.id;
  }

  getAutomationVariablesId(): string {
    return this.data.automationVariablesId;
  }

  getWebsiteId(): string {
    return this.data.websiteId;
  }

  getStatus(): AutomationStatus {
    return this.data.status;
  }

  getStartedAt(): string {
    return this.data.startedAt;
  }

  getCompletedAt(): string | undefined {
    return this.data.completedAt;
  }

  getErrorMessage(): string | undefined {
    return this.data.errorMessage;
  }

  getExecutedSteps(): number {
    return this.data.executedSteps;
  }

  getTotalSteps(): number {
    return this.data.totalSteps;
  }

  getCurrentStepIndex(): number | undefined {
    return this.data.currentStepIndex;
  }

  getLastExecutedUrl(): string | undefined {
    return this.data.lastExecutedUrl;
  }

  getProgressPercentage(): number {
    if (this.data.totalSteps === 0) return 0;
    return Math.round((this.data.executedSteps / this.data.totalSteps) * 100);
  }

  getDuration(): number | undefined {
    if (!this.data.completedAt) return undefined;
    return new Date(this.data.completedAt).getTime() - new Date(this.data.startedAt).getTime();
  }

  isInProgress(): boolean {
    return this.data.status === 'DOING';
  }

  isCompleted(): boolean {
    return this.data.status === 'SUCCESS' || this.data.status === 'FAILED';
  }

  updateProgress(executedSteps: number, currentStepIndex?: number, lastExecutedUrl?: string): void {
    if (executedSteps < 0 || executedSteps > this.data.totalSteps) {
      throw new Error('実行ステップ数が無効です');
    }
    
    this.data.executedSteps = executedSteps;
    if (currentStepIndex !== undefined) {
      this.data.currentStepIndex = currentStepIndex;
    }
    if (lastExecutedUrl !== undefined) {
      this.data.lastExecutedUrl = lastExecutedUrl;
    }
  }

  markAsSuccess(): void {
    this.data.status = 'SUCCESS';
    this.data.completedAt = new Date().toISOString();
    this.data.executedSteps = this.data.totalSteps;
    this.data.errorMessage = undefined;
  }

  markAsFailed(errorMessage: string): void {
    this.data.status = 'FAILED';
    this.data.completedAt = new Date().toISOString();
    this.data.errorMessage = errorMessage;
  }

  toData(): AutomationResultData {
    return { ...this.data };
  }
}
