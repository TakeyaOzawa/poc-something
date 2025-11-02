import { ChromeSchedulerAdapter } from '../ChromeSchedulerAdapter';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChromeSchedulerAdapter', () => {
  let service: ChromeSchedulerAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    (browser.alarms.create as jest.Mock).mockResolvedValue(undefined);
    (browser.alarms.clear as jest.Mock).mockResolvedValue(true);
    (browser.alarms.clearAll as jest.Mock).mockResolvedValue(true);
    service = new ChromeSchedulerAdapter();
  });

  describe('scheduleRepeating', () => {
    it('should create alarm with correct interval', async () => {
      const callback = jest.fn();

      await service.scheduleRepeating('test-alarm', 0.5, callback);

      expect(browser.alarms.create).toHaveBeenCalledWith('test-alarm', {
        periodInMinutes: 0.5,
      });
    });

    it('should store callback', async () => {
      const callback = jest.fn();

      await service.scheduleRepeating('test-alarm', 1, callback);

      // Trigger the alarm listener
      const listener = (browser.alarms.onAlarm.addListener as jest.Mock).mock.calls[0][0];
      listener({ name: 'test-alarm' });

      expect(callback).toHaveBeenCalled();
    });

    it('should not call callback for different alarm', async () => {
      const callback = jest.fn();

      await service.scheduleRepeating('test-alarm', 1, callback);

      // Trigger with different alarm name
      const listener = (browser.alarms.onAlarm.addListener as jest.Mock).mock.calls[0][0];
      listener({ name: 'other-alarm' });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should clear alarm and remove callback', async () => {
      const callback = jest.fn();

      await service.scheduleRepeating('test-alarm', 1, callback);
      await service.cancel('test-alarm');

      expect(browser.alarms.clear).toHaveBeenCalledWith('test-alarm');

      // Callback should not be called after cancel
      const listener = (browser.alarms.onAlarm.addListener as jest.Mock).mock.calls[0][0];
      listener({ name: 'test-alarm' });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cancelAll', () => {
    it('should clear all alarms and callbacks', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      await service.scheduleRepeating('alarm1', 1, callback1);
      await service.scheduleRepeating('alarm2', 1, callback2);

      await service.cancelAll();

      expect(browser.alarms.clearAll).toHaveBeenCalled();

      // No callbacks should be called
      const listener = (browser.alarms.onAlarm.addListener as jest.Mock).mock.calls[0][0];
      listener({ name: 'alarm1' });
      listener({ name: 'alarm2' });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('async callback', () => {
    it('should handle async callbacks', async () => {
      const callback = jest.fn().mockResolvedValue(undefined);

      await service.scheduleRepeating('test-alarm', 1, callback);

      const listener = (browser.alarms.onAlarm.addListener as jest.Mock).mock.calls[0][0];
      listener({ name: 'test-alarm' });

      expect(callback).toHaveBeenCalled();
    });
  });
});
