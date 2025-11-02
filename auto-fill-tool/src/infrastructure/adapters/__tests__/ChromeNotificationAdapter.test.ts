import { ChromeNotificationAdapter } from '../ChromeNotificationAdapter';
import { NotificationPriority } from '@domain/types/notification-port.types';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChromeNotificationAdapter', () => {
  let service: ChromeNotificationAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChromeNotificationAdapter();
    (browser.notifications.create as jest.Mock).mockResolvedValue('notification-id');
    (browser.notifications.clear as jest.Mock).mockResolvedValue(true);
  });

  describe('notify', () => {
    it('should create notification with correct parameters', async () => {
      await service.notify({
        title: 'Test Title',
        message: 'Test Message',
        priority: NotificationPriority.HIGH,
      });

      expect(browser.notifications.create).toHaveBeenCalledWith({
        type: 'basic',
        iconUrl: './icon128.png',
        title: 'Test Title',
        message: 'Test Message',
        priority: 2,
      });
    });

    it('should use default priority when not specified', async () => {
      await service.notify({
        title: 'Test',
        message: 'Message',
      });

      expect(browser.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 1, // NORMAL
        })
      );
    });

    it('should map NORMAL priority correctly', async () => {
      await service.notify({
        title: 'Test',
        message: 'Message',
        priority: NotificationPriority.NORMAL,
      });

      expect(browser.notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 1,
        })
      );
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications', async () => {
      (browser.notifications.getAll as jest.Mock).mockResolvedValue({
        notif1: {},
        notif2: {},
        notif3: {},
      });

      await service.clearAll();

      expect(browser.notifications.clear).toHaveBeenCalledTimes(3);
      expect(browser.notifications.clear).toHaveBeenCalledWith('notif1');
      expect(browser.notifications.clear).toHaveBeenCalledWith('notif2');
      expect(browser.notifications.clear).toHaveBeenCalledWith('notif3');
    });

    it('should handle empty notifications', async () => {
      (browser.notifications.getAll as jest.Mock).mockResolvedValue({});

      await service.clearAll();

      expect(browser.notifications.clear).not.toHaveBeenCalled();
    });
  });
});
