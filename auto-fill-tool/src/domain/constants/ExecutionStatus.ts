/**
 * Execution Status Constants
 */

export const EXECUTION_STATUS = {
  READY: 'ready',
  DOING: 'doing',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export function isExecutionStatus(value: string): value is ExecutionStatus {
  return Object.values(EXECUTION_STATUS).includes(value as ExecutionStatus);
}
