/**
 * Domain Port Interface: NotificationPort
 * Defines contract for user notifications
 */

export enum NotificationPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
}

export interface NotificationOptions {
  title: string;
  message: string;
  priority?: NotificationPriority;
}

export interface NotificationPort {
  notify(options: NotificationOptions): Promise<void>;
  clearAll(): Promise<void>;
}
