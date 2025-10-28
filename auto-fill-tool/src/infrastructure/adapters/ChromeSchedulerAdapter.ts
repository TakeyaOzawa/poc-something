/**
 * Infrastructure Layer: Chrome Scheduler Adapter
 * Implements SchedulerPort using Chrome Alarms API
 * Adapts Chrome Alarms API for scheduled task management
 */

import browser from 'webextension-polyfill';
import { SchedulerPort } from '@domain/types/scheduler-port.types';

export class ChromeSchedulerAdapter implements SchedulerPort {
  private callbacks: Map<string, () => void | Promise<void>> = new Map();

  constructor() {
    // Listen for alarms
    browser.alarms.onAlarm.addListener((alarm) => {
      const callback = this.callbacks.get(alarm.name);
      if (callback) {
        callback();
      }
    });
  }

  async scheduleRepeating(
    name: string,
    intervalMinutes: number,
    callback: () => void | Promise<void>
  ): Promise<void> {
    // Store callback
    this.callbacks.set(name, callback);

    // Create alarm
    await browser.alarms.create(name, {
      periodInMinutes: intervalMinutes,
    });
  }

  async cancel(name: string): Promise<void> {
    // Remove callback
    this.callbacks.delete(name);

    // Clear alarm
    await browser.alarms.clear(name);
  }

  async cancelAll(): Promise<void> {
    // Clear all callbacks
    this.callbacks.clear();

    // Clear all alarms
    await browser.alarms.clearAll();
  }
}
