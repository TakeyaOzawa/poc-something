/**
 * Domain Port Interface: SchedulerPort
 * Defines contract for scheduling periodic tasks
 */

export interface SchedulerPort {
  scheduleRepeating(
    name: string,
    intervalMinutes: number,
    callback: () => void | Promise<void>
  ): Promise<void>;

  cancel(name: string): Promise<void>;
  cancelAll(): Promise<void>;
}
