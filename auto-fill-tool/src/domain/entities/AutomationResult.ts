/**
 * Domain Entity: AutomationResult
 * Represents the execution result of an automation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ExecutionStatus,
  EXECUTION_STATUS,
  isExecutionStatus,
} from '@domain/constants/ExecutionStatus';

export interface AutomationResultData {
  id: string;
  automationVariablesId: string;
  executionStatus: ExecutionStatus;
  resultDetail: string;
  startFrom: string; // ISO 8601
  endTo: string | null; // ISO 8601 or null
  currentStepIndex: number; // Current step index for resume capability (0-based)
  totalSteps: number; // Total number of steps in the automation
  lastExecutedUrl: string; // URL of the last executed page
}

export class AutomationResult {
  private data: AutomationResultData;

  constructor(data: AutomationResultData) {
    this.validate(data);
    // Ensure backward compatibility: set default values for new fields if not present
    this.data = {
      ...data,
      currentStepIndex: data.currentStepIndex ?? 0,
      totalSteps: data.totalSteps ?? 0,
      lastExecutedUrl: data.lastExecutedUrl ?? '',
    };
  }

  private validate(data: AutomationResultData): void {
    if (!data.id) {
      throw new Error('ID is required');
    }
    if (!data.automationVariablesId) {
      throw new Error('AutomationVariables ID is required');
    }
    if (!isExecutionStatus(data.executionStatus)) {
      throw new Error('Invalid execution status');
    }
    if (!data.startFrom) {
      throw new Error('Start time is required');
    }
  }

  // Getters
  getId(): string {
    return this.data.id;
  }

  getAutomationVariablesId(): string {
    return this.data.automationVariablesId;
  }

  getExecutionStatus(): ExecutionStatus {
    return this.data.executionStatus;
  }

  getResultDetail(): string {
    return this.data.resultDetail;
  }

  getStartFrom(): string {
    return this.data.startFrom;
  }

  getEndTo(): string | null {
    return this.data.endTo;
  }

  getCurrentStepIndex(): number {
    return this.data.currentStepIndex;
  }

  getTotalSteps(): number {
    return this.data.totalSteps;
  }

  getLastExecutedUrl(): string {
    return this.data.lastExecutedUrl;
  }

  // Immutable setters
  setExecutionStatus(status: ExecutionStatus): AutomationResult {
    return new AutomationResult({
      ...this.data,
      executionStatus: status,
    });
  }

  setResultDetail(detail: string): AutomationResult {
    return new AutomationResult({
      ...this.data,
      resultDetail: detail,
    });
  }

  setEndTo(endTime: string): AutomationResult {
    return new AutomationResult({
      ...this.data,
      endTo: endTime,
    });
  }

  setCurrentStepIndex(index: number): AutomationResult {
    return new AutomationResult({
      ...this.data,
      currentStepIndex: index,
    });
  }

  setTotalSteps(total: number): AutomationResult {
    return new AutomationResult({
      ...this.data,
      totalSteps: total,
    });
  }

  setLastExecutedUrl(url: string): AutomationResult {
    return new AutomationResult({
      ...this.data,
      lastExecutedUrl: url,
    });
  }

  // Export data
  toData(): AutomationResultData {
    return { ...this.data };
  }

  // Clone
  clone(): AutomationResult {
    return new AutomationResult({ ...this.data });
  }

  // Static factory
  static create(params: {
    automationVariablesId: string;
    executionStatus?: ExecutionStatus;
    resultDetail?: string;
    currentStepIndex?: number;
    totalSteps?: number;
    lastExecutedUrl?: string;
  }): AutomationResult {
    return new AutomationResult({
      id: uuidv4(),
      automationVariablesId: params.automationVariablesId,
      executionStatus: params.executionStatus || EXECUTION_STATUS.READY,
      resultDetail: params.resultDetail || '',
      startFrom: new Date().toISOString(),
      endTo: null,
      currentStepIndex: params.currentStepIndex || 0,
      totalSteps: params.totalSteps || 0,
      lastExecutedUrl: params.lastExecutedUrl || '',
    });
  }

  // Helper: Calculate duration in seconds
  getDurationSeconds(): number | null {
    if (!this.data.endTo) return null;
    const start = new Date(this.data.startFrom).getTime();
    const end = new Date(this.data.endTo).getTime();
    return (end - start) / 1000;
  }

  // Helper: Check if in progress
  isInProgress(): boolean {
    return this.data.executionStatus === EXECUTION_STATUS.DOING;
  }

  // Helper: Check if successful
  isSuccess(): boolean {
    return this.data.executionStatus === EXECUTION_STATUS.SUCCESS;
  }

  // Helper: Check if failed
  isFailed(): boolean {
    return this.data.executionStatus === EXECUTION_STATUS.FAILED;
  }

  // Helper: Calculate progress percentage
  getProgressPercentage(): number {
    if (this.data.totalSteps === 0) return 0;
    return Math.floor((this.data.currentStepIndex / this.data.totalSteps) * 100);
  }
}
